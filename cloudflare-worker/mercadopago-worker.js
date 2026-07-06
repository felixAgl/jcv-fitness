/**
 * Cloudflare Worker for MercadoPago Integration
 *
 * Handles:
 * 1. Preference Creation (POST /)
 * 2. Webhook Notifications (POST /webhook)
 *
 * Required secrets:
 * - MP_ACCESS_TOKEN: MercadoPago access token
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_KEY: Supabase service role key
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const ALLOWED_ORIGINS = [
  'https://jcv24fitness.com',
  'https://www.jcv24fitness.com',
  'https://jcv-fitness.pages.dev',
  'https://staging.jcv-fitness.pages.dev',
  'https://felixagl.github.io',
  'http://localhost:3000',
  'http://localhost:5173',
];

const PLAN_CONFIG = {
  49900: { type: 'PLAN_BASICO', days: 40 },
  89900: { type: 'PLAN_PRO', days: 40 },
  149900: { type: 'PLAN_PREMIUM', days: 40 },
};

// =============================================================================
// ERROR TYPES - Distinguir errores recuperables vs permanentes
// =============================================================================

const ErrorType = {
  // Errores de configuracion - NO reintentar, alertar admin
  CONFIG_ERROR: 'CONFIG_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',

  // Errores de datos - NO reintentar, datos invalidos
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Errores temporales - SI reintentar
  NETWORK_ERROR: 'NETWORK_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  SERVER_ERROR: 'SERVER_ERROR',
};

class WorkerError extends Error {
  constructor(message, type, details = {}) {
    super(message);
    this.name = 'WorkerError';
    this.type = type;
    this.details = details;
    this.shouldRetry = [ErrorType.NETWORK_ERROR, ErrorType.RATE_LIMIT, ErrorType.SERVER_ERROR].includes(type);
  }
}

// =============================================================================
// HELPERS
// =============================================================================

const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
});

const jsonResponse = (data, status, origin = '*') => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
    },
  });
};

function validateEnvConfig(env) {
  const missing = [];
  if (!env.MP_ACCESS_TOKEN) missing.push('MP_ACCESS_TOKEN');
  if (!env.SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!env.SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_KEY');

  if (missing.length > 0) {
    throw new WorkerError(
      `Missing required configuration: ${missing.join(', ')}`,
      ErrorType.CONFIG_ERROR,
      { missing }
    );
  }
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Route
    if (url.pathname === '/webhook' || url.pathname === '/api/webhooks/mercadopago') {
      return handleWebhook(request, env, origin);
    }

    if (url.pathname === '/booking-notify') {
      return handleBookingNotify(request, env);
    }

    return handlePreferenceCreation(request, env, origin);
  },
};

// =============================================================================
// WEBHOOK HANDLER
// =============================================================================

async function handleWebhook(request, env, origin) {
  const startTime = Date.now();
  let logId = null;

  // Health check
  if (request.method === 'GET') {
    return jsonResponse({ status: 'ok', service: 'mercadopago-webhook' }, 200);
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    // Validar configuracion antes de procesar
    validateEnvConfig(env);

    const body = await request.json();
    const { type, data, action } = body;

    // STEP 1: Log inmediato
    logId = await logWebhook(env, {
      status: 'received',
      webhook_type: type || 'unknown',
      webhook_action: action,
      raw_payload: body,
      headers: Object.fromEntries(request.headers),
      payment_id: data?.id ? parseInt(data.id) : null,
    });

    // STEP 2: Validar tipo de notificacion
    if (type !== 'payment' && action !== 'payment.updated' && action !== 'payment.created') {
      await updateWebhookLog(env, logId, {
        status: 'ignored',
        error_message: `Ignored non-payment notification: type=${type}, action=${action}`,
        processed_at: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
      });
      return jsonResponse({ received: true, ignored: true, reason: 'non-payment', log_id: logId }, 200);
    }

    const paymentId = data?.id;
    if (!paymentId) {
      await updateWebhookLog(env, logId, {
        status: 'failed',
        error_message: 'No payment ID in webhook payload',
        processed_at: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
      });
      return jsonResponse({ error: 'No payment ID', log_id: logId }, 400);
    }

    // STEP 3: Idempotencia - verificar duplicados
    const existingLog = await checkDuplicateWebhook(env, paymentId, action);
    if (existingLog) {
      await updateWebhookLog(env, logId, {
        status: 'ignored',
        is_duplicate: true,
        duplicate_of: existingLog.id,
        error_message: 'Duplicate webhook - already processed',
        processed_at: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
      });
      return jsonResponse({ received: true, duplicate: true, original_log_id: existingLog.id, log_id: logId }, 200);
    }

    // STEP 4: Marcar como procesando
    await updateWebhookLog(env, logId, { status: 'processing' });

    // STEP 5: Obtener detalles del pago
    const paymentResult = await fetchPaymentDetails(paymentId, env.MP_ACCESS_TOKEN);

    if (paymentResult.error) {
      const { error } = paymentResult;

      await updateWebhookLog(env, logId, {
        status: error.shouldRetry ? 'failed' : 'ignored',
        error_message: error.message,
        error_details: { type: error.type, ...error.details },
        processed_at: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
      });

      // Solo devolver 500 si el error es recuperable (MP debe reintentar)
      if (error.shouldRetry) {
        return jsonResponse({
          error: error.message,
          type: error.type,
          shouldRetry: true,
          log_id: logId
        }, 500);
      }

      // Error permanente (NOT_FOUND, AUTH_ERROR) - devolver 200 para que MP no reintente
      return jsonResponse({
        received: true,
        processed: false,
        reason: error.message,
        type: error.type,
        log_id: logId
      }, 200);
    }

    const payment = paymentResult.data;

    // STEP 6: Log detalles del pago
    await updateWebhookLog(env, logId, {
      payment_status: payment.status,
      payment_amount: payment.transaction_amount,
      user_email: payment.payer?.email,
      mp_api_response: {
        id: payment.id,
        status: payment.status,
        status_detail: payment.status_detail,
        amount: payment.transaction_amount,
        external_reference: payment.external_reference,
        payer: payment.payer,
        metadata: payment.metadata,
      },
    });

    // STEP 7: Solo procesar pagos aprobados
    if (payment.status !== 'approved') {
      await updateWebhookLog(env, logId, {
        status: 'ignored',
        error_message: `Payment not approved: ${payment.status} (${payment.status_detail})`,
        processed_at: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
      });
      return jsonResponse({
        received: true,
        status: payment.status,
        status_detail: payment.status_detail,
        message: 'Payment not approved yet',
        log_id: logId
      }, 200);
    }

    // STEP 8: Activar suscripcion
    const result = await activateSubscription(payment, env, logId);

    // STEP 9: Exito
    await updateWebhookLog(env, logId, {
      status: 'success',
      user_id: result.user_id,
      subscription_id: result.subscription_id,
      plan_type: result.plan_type,
      processed_at: new Date().toISOString(),
      processing_time_ms: Date.now() - startTime,
    });

    return jsonResponse({
      received: true,
      processed: true,
      subscription: result,
      log_id: logId
    }, 200);

  } catch (error) {
    console.error('[Webhook] Error:', error);

    const isWorkerError = error instanceof WorkerError;
    const errorType = isWorkerError ? error.type : ErrorType.SERVER_ERROR;
    const shouldRetry = isWorkerError ? error.shouldRetry : true;

    if (logId) {
      await updateWebhookLog(env, logId, {
        status: 'failed',
        error_message: error.message,
        error_details: {
          type: errorType,
          stack: error.stack,
          name: error.name,
          ...(isWorkerError ? error.details : {}),
        },
        processed_at: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
      });
    }

    // CONFIG_ERROR siempre devuelve 500 - necesita atencion inmediata
    if (errorType === ErrorType.CONFIG_ERROR) {
      return jsonResponse({
        error: 'Server configuration error',
        message: error.message,
        log_id: logId
      }, 500);
    }

    return jsonResponse({
      error: shouldRetry ? 'Internal server error' : error.message,
      shouldRetry,
      log_id: logId
    }, shouldRetry ? 500 : 200);
  }
}

// =============================================================================
// MERCADOPAGO API
// =============================================================================

async function fetchPaymentDetails(paymentId, accessToken) {
  // Validar token
  if (!accessToken) {
    return {
      error: new WorkerError(
        'MP_ACCESS_TOKEN not configured',
        ErrorType.CONFIG_ERROR
      )
    };
  }

  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    // Manejar diferentes codigos de respuesta
    if (response.status === 401 || response.status === 403) {
      return {
        error: new WorkerError(
          'Invalid or expired MercadoPago access token',
          ErrorType.AUTH_ERROR,
          { status: response.status }
        )
      };
    }

    if (response.status === 404) {
      return {
        error: new WorkerError(
          `Payment ${paymentId} not found in MercadoPago`,
          ErrorType.NOT_FOUND,
          { payment_id: paymentId }
        )
      };
    }

    if (response.status === 429) {
      return {
        error: new WorkerError(
          'MercadoPago rate limit exceeded',
          ErrorType.RATE_LIMIT,
          { status: response.status }
        )
      };
    }

    if (response.status >= 500) {
      return {
        error: new WorkerError(
          'MercadoPago server error',
          ErrorType.SERVER_ERROR,
          { status: response.status }
        )
      };
    }

    if (!response.ok) {
      const errorText = await response.text();
      return {
        error: new WorkerError(
          `MercadoPago API error: ${response.status}`,
          ErrorType.SERVER_ERROR,
          { status: response.status, body: errorText }
        )
      };
    }

    const data = await response.json();
    return { data };

  } catch (error) {
    // Error de red (DNS, timeout, etc)
    return {
      error: new WorkerError(
        `Network error fetching payment: ${error.message}`,
        ErrorType.NETWORK_ERROR,
        { originalError: error.message }
      )
    };
  }
}

// =============================================================================
// LOGGING HELPERS
// =============================================================================

async function logWebhook(env, data) {
  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/webhook_logs`,
      {
        method: 'POST',
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          ...data,
          received_at: new Date().toISOString(),
        }),
      }
    );

    if (!response.ok) {
      console.error('[Log] Failed to create webhook log:', await response.text());
      return null;
    }

    const result = await response.json();
    return result?.[0]?.id || null;
  } catch (error) {
    console.error('[Log] Error creating webhook log:', error);
    return null;
  }
}

async function updateWebhookLog(env, logId, data) {
  if (!logId) return;

  try {
    await fetch(
      `${env.SUPABASE_URL}/rest/v1/webhook_logs?id=eq.${logId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
  } catch (error) {
    console.error('[Log] Error updating webhook log:', error);
  }
}

async function checkDuplicateWebhook(env, paymentId, action) {
  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/webhook_logs?payment_id=eq.${paymentId}&webhook_action=eq.${action}&status=eq.success&limit=1`,
      {
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data?.[0] || null;
  } catch (error) {
    console.error('[Log] Error checking duplicate:', error);
    return null;
  }
}

// =============================================================================
// SUBSCRIPTION ACTIVATION
// =============================================================================

async function activateSubscription(payment, env, webhookLogId) {
  const { SUPABASE_URL: supabaseUrl, SUPABASE_SERVICE_KEY: supabaseKey } = env;
  const operations = [];

  // Extract user info
  const externalRef = payment.external_reference || '';
  const payerEmail = payment.payer?.email;
  const userId = payment.metadata?.user_id;

  // Try to extract user_id from external_reference (format: JCV-timestamp-userId)
  let userIdFromRef = null;
  const refParts = externalRef.split('-');
  if (refParts.length >= 3) {
    userIdFromRef = refParts.slice(2).join('-');
  }

  // Find user by multiple methods
  let user = null;
  let userLookupMethod = null;

  if (userId) {
    user = await supabaseQuery(supabaseUrl, supabaseKey, 'profiles', 'id,email', `id=eq.${userId}`);
    if (user) userLookupMethod = 'metadata_user_id';
    operations.push({ op: 'user_lookup_metadata', success: !!user, value: userId });
  }

  if (!user && userIdFromRef) {
    user = await supabaseQuery(supabaseUrl, supabaseKey, 'profiles', 'id,email', `id=eq.${userIdFromRef}`);
    if (user) userLookupMethod = 'external_reference';
    operations.push({ op: 'user_lookup_ref', success: !!user, value: userIdFromRef });
  }

  if (!user && payerEmail) {
    user = await supabaseQuery(supabaseUrl, supabaseKey, 'profiles', 'id,email', `email=eq.${payerEmail}`);
    if (user) userLookupMethod = 'payer_email';
    operations.push({ op: 'user_lookup_email', success: !!user, value: payerEmail });
  }

  if (!user) {
    const errorMsg = `User not found. Tried: metadata=${userId}, ref=${userIdFromRef}, email=${payerEmail}`;
    operations.push({ op: 'user_lookup_failed', error: errorMsg });

    if (webhookLogId) {
      await updateWebhookLog(env, webhookLogId, {
        supabase_operations: operations,
        error_details: { user_lookup_failed: true, metadata: userId, ref: userIdFromRef, email: payerEmail },
      });
    }

    throw new WorkerError(errorMsg, ErrorType.VALIDATION_ERROR, {
      metadata: userId,
      ref: userIdFromRef,
      email: payerEmail
    });
  }

  // Determine plan type from amount
  const amount = payment.transaction_amount;
  const planConfig = PLAN_CONFIG[amount];

  if (!planConfig) {
    console.warn(`[Webhook] Amount ${amount} not in PLAN_CONFIG, using fallback`);
    operations.push({ op: 'plan_lookup', success: false, amount, fallback: true });
  } else {
    operations.push({ op: 'plan_lookup', success: true, amount, plan: planConfig.type });
  }

  const planType = planConfig?.type || payment.metadata?.plan_type || 'PLAN_BASICO';
  const planDays = planConfig?.days || 40;

  // Check if subscription already exists (idempotency)
  const existingSub = await supabaseQuery(
    supabaseUrl, supabaseKey, 'subscriptions', 'id', `payment_reference=eq.${payment.id}`
  );

  if (existingSub) {
    operations.push({ op: 'subscription_exists', subscription_id: existingSub.id });

    if (webhookLogId) {
      await updateWebhookLog(env, webhookLogId, {
        subscription_id: existingSub.id,
        user_id: user.id,
        supabase_operations: operations,
      });
    }

    return {
      status: 'already_exists',
      subscription_id: existingSub.id,
      user_id: user.id,
      plan_type: planType,
    };
  }

  operations.push({ op: 'subscription_check', exists: false });

  // Create subscription
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + planDays);

  const subscription = await supabaseInsert(supabaseUrl, supabaseKey, 'subscriptions', {
    user_id: user.id,
    plan_type: planType,
    status: 'active',
    start_date: new Date().toISOString(),
    end_date: endDate.toISOString(),
    payment_provider: 'mercadopago',
    payment_reference: String(payment.id),
    amount_paid: amount,
  });

  operations.push({ op: 'subscription_insert', success: !!subscription, id: subscription?.id });

  // Update user profile
  await supabaseUpdate(supabaseUrl, supabaseKey, 'profiles', user.id, {
    has_active_subscription: true,
    current_plan: planType,
    subscription_end_date: endDate.toISOString(),
    updated_at: new Date().toISOString(),
  });

  operations.push({ op: 'profile_update', success: true });

  // Create audit log
  try {
    await supabaseInsert(supabaseUrl, supabaseKey, 'subscription_audit_log', {
      subscription_id: subscription?.id,
      user_id: user.id,
      operation: 'activated',
      new_data: {
        plan_type: planType,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        amount_paid: amount,
      },
      trigger_source: 'webhook',
      trigger_reference: String(payment.id),
      metadata: {
        webhook_log_id: webhookLogId,
        user_lookup_method: userLookupMethod,
        payment_status: payment.status,
      },
    });
    operations.push({ op: 'audit_log', success: true });
  } catch (e) {
    operations.push({ op: 'audit_log', success: false, error: e.message });
  }

  // Update webhook log
  if (webhookLogId) {
    await updateWebhookLog(env, webhookLogId, {
      subscription_id: subscription?.id,
      user_id: user.id,
      plan_type: planType,
      supabase_operations: operations,
    });
  }

  console.log('[Webhook] Subscription activated:', {
    user: user.email,
    plan: planType,
    subscription_id: subscription?.id,
    expires: endDate.toISOString(),
  });

  return {
    status: 'activated',
    subscription_id: subscription?.id,
    user_id: user.id,
    plan_type: planType,
    expires: endDate.toISOString(),
  };
}

// =============================================================================
// SUPABASE REST API HELPERS
// =============================================================================

async function supabaseQuery(url, key, table, select, filter) {
  const response = await fetch(
    `${url}/rest/v1/${table}?select=${select}&${filter}&limit=1`,
    {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
    }
  );

  if (!response.ok) {
    console.error('[Supabase] Query error:', response.status);
    return null;
  }

  const data = await response.json();
  return data?.[0] || null;
}

async function supabaseInsert(url, key, table, data) {
  const response = await fetch(
    `${url}/rest/v1/${table}`,
    {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('[Supabase] Insert error:', error);
    throw new WorkerError(`Supabase insert failed: ${error}`, ErrorType.SERVER_ERROR);
  }

  const result = await response.json();
  return result?.[0] || null;
}

async function supabaseUpdate(url, key, table, id, data) {
  const response = await fetch(
    `${url}/rest/v1/${table}?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('[Supabase] Update error:', error);
    throw new WorkerError(`Supabase update failed: ${error}`, ErrorType.SERVER_ERROR);
  }

  return true;
}

// =============================================================================
// PREFERENCE CREATION
// =============================================================================

async function handlePreferenceCreation(request, env, origin) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders(origin)['Access-Control-Allow-Origin']);
  }

  try {
    // Validar configuracion
    if (!env.MP_ACCESS_TOKEN) {
      throw new WorkerError('MP_ACCESS_TOKEN not configured', ErrorType.CONFIG_ERROR);
    }

    const body = await request.json();
    const { items, payer, backUrls, planType, userId } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Items are required' }), {
        status: 400,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // Determine URLs
    const isProduction = origin.includes('jcv24fitness.com');
    const baseUrl = isProduction ? 'https://jcv24fitness.com' : origin;
    const requestUrl = new URL(request.url);
    const workerUrl = env.WORKER_URL || `https://${requestUrl.hostname}`;

    // Build preference
    const preferenceData = {
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description || '',
        quantity: item.quantity || 1,
        currency_id: item.currencyId || 'COP',
        unit_price: item.unitPrice,
      })),
      back_urls: backUrls || {
        success: `${baseUrl}/payment/success`,
        failure: `${baseUrl}/payment/failure`,
        pending: `${baseUrl}/payment/pending`,
      },
      auto_return: 'approved',
      statement_descriptor: 'JCV FITNESS',
      external_reference: userId ? `JCV-${Date.now()}-${userId}` : `JCV-${Date.now()}`,
      notification_url: `${workerUrl}/webhook`,
      metadata: {
        user_id: userId || null,
        plan_type: planType || 'PLAN_BASICO',
        origin: origin,
      },
    };

    if (payer?.email) {
      preferenceData.payer = {
        email: payer.email,
        name: payer.name || '',
      };
    }

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceData),
    });

    if (!mpResponse.ok) {
      const errorData = await mpResponse.text();
      console.error('MercadoPago error:', errorData);

      // Distinguir tipo de error
      if (mpResponse.status === 401 || mpResponse.status === 403) {
        return new Response(JSON.stringify({
          error: 'Authentication error with MercadoPago',
          details: 'Invalid access token'
        }), {
          status: 500,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Failed to create preference', details: errorData }), {
        status: mpResponse.status,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    const preference = await mpResponse.json();

    return new Response(JSON.stringify({
      id: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
    }), {
      status: 200,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Worker error:', error);

    const isConfigError = error instanceof WorkerError && error.type === ErrorType.CONFIG_ERROR;

    return new Response(JSON.stringify({
      error: isConfigError ? 'Server configuration error' : 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }
}

// =============================================================================
// BOOKING NOTIFICATION HANDLER (WhatsApp via Green API)
// =============================================================================

async function handleBookingNotify(request, env) {
  if (request.method === 'GET') {
    return jsonResponse({ status: 'ok', service: 'booking-notify' }, 200);
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Verify webhook secret
  const authHeader = request.headers.get('Authorization') || '';
  const secret = env.BOOKING_WEBHOOK_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  // Check CallMeBot config
  if (!env.CALLMEBOT_API_KEY || !env.TRAINER_WHATSAPP) {
    console.error('[booking-notify] Missing WhatsApp config');
    return jsonResponse({ status: 'ignored', reason: 'notification service not configured' }, 200);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const { type, table, record } = payload;
  if (table !== 'bookings' || !record) {
    return jsonResponse({ status: 'ignored', reason: 'not a bookings event' }, 200);
  }

  const isNewBooking = type === 'INSERT' && record.status === 'confirmed';
  const isCancellation = type === 'UPDATE' && record.status === 'cancelled';
  if (!isNewBooking && !isCancellation) {
    return jsonResponse({ status: 'ignored', reason: 'not a relevant event' }, 200);
  }

  try {
    const supabaseUrl = env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_KEY;

    const [slotRes, clientRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/training_slots?id=eq.${record.slot_id}&select=title,slot_date,start_time,end_time`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      }),
      fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${record.user_id}&select=full_name,email`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      }),
    ]);

    const [slots, clients] = await Promise.all([slotRes.json(), clientRes.json()]);
    const slot = slots[0];
    const client = clients[0];

    if (!slot) {
      console.error(`[booking-notify] Slot not found: ${record.slot_id}`);
      return jsonResponse({ status: 'error', reason: 'slot not found' }, 200);
    }

    const clientName = client?.full_name || client?.email || 'Un cliente';
    const dateStr = formatSlotDate(slot.slot_date);
    const timeStr = formatSlotTime(slot.start_time);

    const message = isNewBooking
      ? `*Nueva reserva!*\n${clientName} reservo *${slot.title}* para el ${dateStr} a las ${timeStr}.`
      : `*Cancelacion!*\n${clientName} cancelo su reserva de *${slot.title}* del ${dateStr} a las ${timeStr}.`;

    await sendWhatsApp(env, message);

    console.log(`[booking-notify] Sent ${isNewBooking ? 'booking' : 'cancellation'} notification for slot ${record.slot_id}`);
    return jsonResponse({ status: 'ok' }, 200);
  } catch (err) {
    console.error('[booking-notify] Error:', err.message);
    return jsonResponse({ status: 'error', reason: err.message }, 500);
  }
}

function formatSlotDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

function formatSlotTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const display = h % 12 || 12;
  return `${display}:${String(m).padStart(2, '0')} ${ampm}`;
}

async function sendWhatsApp(env, message) {
  const phone = env.TRAINER_WHATSAPP; // e.g. 573108297118 (country code + number, no +)
  const apikey = env.CALLMEBOT_API_KEY;
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${apikey}`;

  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CallMeBot ${res.status}: ${text}`);
  }
}
