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

const ALLOWED_ORIGINS = [
  'https://jcv24fitness.com',
  'https://www.jcv24fitness.com',
  'https://jcv-fitness.pages.dev',
  'https://staging.jcv-fitness.pages.dev',
  'https://felixagl.github.io',
  'http://localhost:3000',
  'http://localhost:5173',
];

// Plan configuration
const PLAN_CONFIG = {
  49900: { type: 'PLAN_BASICO', days: 40 },
  89900: { type: 'PLAN_PRO', days: 40 },
  149900: { type: 'PLAN_PREMIUM', days: 40 },
};

const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    // Route based on path
    if (url.pathname === '/webhook' || url.pathname === '/api/webhooks/mercadopago') {
      return handleWebhook(request, env, origin);
    }

    // Default: handle preference creation
    return handlePreferenceCreation(request, env, origin);
  },
};

// ============================================================================
// WEBHOOK HANDLER WITH FULL LOGGING
// ============================================================================

async function handleWebhook(request, env, origin) {
  const startTime = Date.now();
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  if (request.method === 'GET') {
    return new Response(JSON.stringify({ status: 'ok', service: 'mercadopago-webhook' }), {
      status: 200,
      headers,
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers,
    });
  }

  let logId = null;
  let body = null;

  try {
    body = await request.json();
    const { type, data, action } = body;

    // STEP 1: Log webhook receipt immediately
    logId = await logWebhook(env, {
      status: 'received',
      webhook_type: type || 'unknown',
      webhook_action: action,
      raw_payload: body,
      headers: Object.fromEntries(request.headers),
      payment_id: data?.id ? parseInt(data.id) : null,
    });

    console.log(`[Webhook] Received and logged: ${logId}`);

    // STEP 2: Validate notification type
    if (type !== 'payment' && action !== 'payment.updated' && action !== 'payment.created') {
      await updateWebhookLog(env, logId, {
        status: 'ignored',
        error_message: `Ignored non-payment notification: type=${type}, action=${action}`,
        processed_at: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
      });

      return new Response(JSON.stringify({ received: true, ignored: true, log_id: logId }), {
        status: 200,
        headers,
      });
    }

    const paymentId = data?.id;
    if (!paymentId) {
      await updateWebhookLog(env, logId, {
        status: 'failed',
        error_message: 'No payment ID in webhook payload',
        processed_at: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
      });

      return new Response(JSON.stringify({ error: 'No payment ID', log_id: logId }), {
        status: 400,
        headers,
      });
    }

    // STEP 3: Check for duplicate webhook (idempotency)
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

      return new Response(JSON.stringify({
        received: true,
        duplicate: true,
        original_log_id: existingLog.id,
        log_id: logId
      }), {
        status: 200,
        headers,
      });
    }

    // STEP 4: Mark as processing
    await updateWebhookLog(env, logId, { status: 'processing' });

    // STEP 5: Fetch payment details from MercadoPago
    const payment = await fetchPaymentDetails(paymentId, env.MP_ACCESS_TOKEN);
    if (!payment) {
      // Return 200 to acknowledge receipt - payment may not exist (test/deleted)
      // This prevents MercadoPago from retrying unnecessarily
      await updateWebhookLog(env, logId, {
        status: 'ignored',
        error_message: 'Payment not found in MercadoPago API (may be test or deleted)',
        error_details: { payment_id: paymentId },
        processed_at: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
      });

      return new Response(JSON.stringify({
        received: true,
        processed: false,
        reason: 'Payment not found in MercadoPago API',
        log_id: logId
      }), {
        status: 200,
        headers,
      });
    }

    // STEP 6: Log payment details
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

    console.log('[Webhook] Payment details:', {
      id: payment.id,
      status: payment.status,
      amount: payment.transaction_amount,
      payer_email: payment.payer?.email,
    });

    // STEP 7: Only process approved payments
    if (payment.status !== 'approved') {
      await updateWebhookLog(env, logId, {
        status: 'ignored',
        error_message: `Payment not approved: ${payment.status} (${payment.status_detail})`,
        processed_at: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
      });

      return new Response(JSON.stringify({
        received: true,
        status: payment.status,
        status_detail: payment.status_detail,
        message: 'Payment not approved yet',
        log_id: logId
      }), {
        status: 200,
        headers,
      });
    }

    // STEP 8: Activate subscription
    const result = await activateSubscription(payment, env, logId);

    // STEP 9: Mark as success
    await updateWebhookLog(env, logId, {
      status: 'success',
      user_id: result.user_id,
      subscription_id: result.subscription_id,
      plan_type: result.plan_type,
      processed_at: new Date().toISOString(),
      processing_time_ms: Date.now() - startTime,
    });

    return new Response(JSON.stringify({
      received: true,
      processed: true,
      subscription: result,
      log_id: logId
    }), {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('[Webhook] Error:', error);

    if (logId) {
      await updateWebhookLog(env, logId, {
        status: 'failed',
        error_message: error.message,
        error_details: {
          stack: error.stack,
          name: error.name,
        },
        processed_at: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
      });
    }

    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
      log_id: logId
    }), {
      status: 500,
      headers,
    });
  }
}

// ============================================================================
// LOGGING HELPERS
// ============================================================================

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

// ============================================================================
// MERCADOPAGO API
// ============================================================================

async function fetchPaymentDetails(paymentId, accessToken) {
  if (!accessToken) {
    console.error('[Webhook] MP_ACCESS_TOKEN not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error('[Webhook] MercadoPago API error:', response.status);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('[Webhook] Error fetching payment:', error);
    return null;
  }
}

// ============================================================================
// SUBSCRIPTION ACTIVATION
// ============================================================================

async function activateSubscription(payment, env, webhookLogId) {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_KEY;
  const operations = [];

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase not configured');
  }

  // Extract user info from payment
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

    throw new Error(errorMsg);
  }

  console.log(`[Webhook] Found user via ${userLookupMethod}:`, user.email);

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

  // Check if subscription already exists (idempotency at DB level)
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

  // Update webhook log with all operations
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

// ============================================================================
// SUPABASE REST API HELPERS
// ============================================================================

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
    throw new Error(`Supabase insert failed: ${error}`);
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
    throw new Error(`Supabase update failed: ${error}`);
  }

  return true;
}

// ============================================================================
// PREFERENCE CREATION (Original functionality)
// ============================================================================

async function handlePreferenceCreation(request, env, origin) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { items, payer, backUrls, planType, userId } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Items are required' }), {
        status: 400,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // Determine the base URL for redirects
    const isProduction = origin.includes('jcv24fitness.com');
    const baseUrl = isProduction ? 'https://jcv24fitness.com' : origin;

    // Worker URL for webhook - use env variable or detect from request URL
    const requestUrl = new URL(request.url);
    const workerUrl = env.WORKER_URL || `https://${requestUrl.hostname}`;

    // Create MercadoPago preference
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
      external_reference: userId
        ? `JCV-${Date.now()}-${userId}`
        : `JCV-${Date.now()}`,
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
    return new Response(JSON.stringify({ error: 'Internal server error', message: error.message }), {
      status: 500,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }
}
