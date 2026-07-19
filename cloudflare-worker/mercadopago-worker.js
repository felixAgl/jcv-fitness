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

// Amount (COP, no decimals) -> plan. This is the SINGLE SOURCE OF TRUTH for
// valid prices. A transaction_amount that is not an exact key here is rejected.
const PLAN_CONFIG = {
  49900: { type: 'PLAN_BASICO', days: 40 },
  89900: { type: 'PLAN_PRO', days: 40 },
  149900: { type: 'PLAN_PREMIUM', days: 40 },
};

// Reverse map: planType -> server-side price. Used to derive unit_price during
// preference creation so the client can NEVER dictate the amount charged.
const PLAN_PRICES = {
  PLAN_BASICO: 49900,
  PLAN_PRO: 89900,
  PLAN_PREMIUM: 149900,
};

// Currency is fixed for this business; never trust a client-supplied currency.
const PLAN_CURRENCY = 'COP';

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

/**
 * Resolve the worker's runtime environment ('production' | anything else).
 * Priority: explicit ENVIRONMENT var -> inferred from MP token prefix.
 * TEST- tokens imply a non-production environment.
 */
function resolveEnvironment(env) {
  if (env.ENVIRONMENT) return env.ENVIRONMENT.toLowerCase();
  return (env.MP_ACCESS_TOKEN || '').startsWith('TEST-') ? 'test' : 'production';
}

// Constant-time comparison of two hex strings (avoids leaking match position).
function timingSafeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Verify a MercadoPago webhook signature per the official spec.
 *
 * MP sends:
 *   x-signature:  "ts=<unix_ts>,v1=<hmac_sha256_hex>"
 *   x-request-id: "<uuid>"
 * The signed manifest is: `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`
 * HMAC-SHA256 with the webhook secret, compared (timing-safe) against v1.
 *
 * FALLBACK: if MP_WEBHOOK_SECRET is unset we log a loud warning and let the
 * request through (enforced=false) so a mid-deploy secret rotation cannot drop
 * live payments. The orchestrator MUST set MP_WEBHOOK_SECRET and then this path
 * becomes strict automatically (reject 401 on mismatch).
 */
async function verifyWebhookSignature(request, body, env) {
  const secret = env.MP_WEBHOOK_SECRET;

  if (!secret) {
    console.warn(
      '[Webhook][SECURITY] MP_WEBHOOK_SECRET is NOT set — signature verification SKIPPED. ' +
      'Any actor can POST forged webhooks. Set the secret ASAP to enforce strict mode.'
    );
    return { valid: true, enforced: false, reason: 'secret_unset' };
  }

  const xSignature = request.headers.get('x-signature') || '';
  const xRequestId = request.headers.get('x-request-id') || '';

  // Parse "ts=...,v1=..." into { ts, v1 }
  const parts = {};
  for (const segment of xSignature.split(',')) {
    const idx = segment.indexOf('=');
    if (idx === -1) continue;
    parts[segment.slice(0, idx).trim()] = segment.slice(idx + 1).trim();
  }
  const ts = parts.ts;
  const v1 = parts.v1;

  if (!ts || !v1) {
    return { valid: false, enforced: true, reason: 'missing_ts_or_v1' };
  }

  // MP manifest uses the data.id value; alphanumeric ids are lowercased.
  const rawId = body?.data?.id != null ? String(body.data.id) : '';
  const dataId = /[a-zA-Z]/.test(rawId) ? rawId.toLowerCase() : rawId;
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest));
  const computed = [...new Uint8Array(sigBuffer)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const valid = timingSafeEqualHex(computed, v1);
  return { valid, enforced: true, reason: valid ? 'ok' : 'signature_mismatch' };
}

/**
 * Call a Supabase RPC (SECURITY DEFINER function) with the service role key.
 */
async function callRpc(env, fn, args = {}) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      'apikey': env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new WorkerError(
      `RPC ${fn} failed: ${response.status} ${text.slice(0, 200)}`,
      ErrorType.SERVER_ERROR,
      { fn, status: response.status }
    );
  }
  return response.json().catch(() => null);
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

export default {
  async scheduled(_, env) {
    // Keep-alive ping — prevents Supabase free tier pause after 1 week inactive
    try {
      await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`, {
        headers: { apikey: env.SUPABASE_SERVICE_KEY },
      });
    } catch (e) {
      console.error('[KeepAlive] Ping failed:', e.message);
    }

    // Self-healing checkout — reconcile approved MP payments missing a subscription
    try {
      await reconcilePayments(env);
    } catch (e) {
      console.error('[Reconcile] Sweep failed:', e.message);
    }

    // Expiration sweep — deactivate plans/subscriptions whose end_date has passed.
    // Runs with the service role; RPCs are SECURITY DEFINER maintenance functions.
    try {
      const expiredSubs = await callRpc(env, 'expire_old_subscriptions');
      const expiredPlans = await callRpc(env, 'expire_old_plans');
      console.log('[Expire] Sweep done:', { subscriptions: expiredSubs, plans: expiredPlans });
    } catch (e) {
      console.error('[Expire] RPC sweep failed:', e.message);
    }
  },

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

    // STEP 1.5: Verificar firma HMAC del webhook (MercadoPago x-signature)
    const sig = await verifyWebhookSignature(request, body, env);
    if (sig.enforced && !sig.valid) {
      await updateWebhookLog(env, logId, {
        status: 'rejected',
        error_message: `Webhook signature verification failed: ${sig.reason}`,
        error_details: { signature: sig.reason, x_request_id: request.headers.get('x-request-id') },
        processed_at: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
      });
      console.warn('[Webhook][SECURITY] Rejected webhook with invalid signature:', sig.reason);
      return jsonResponse({ error: 'Invalid signature', log_id: logId }, 401);
    }
    if (!sig.enforced) {
      // Fallback mode — flag on the audit record so it is greppable until the
      // secret is set and strict enforcement kicks in.
      await updateWebhookLog(env, logId, {
        error_details: { signature: 'unverified_secret_unset' },
      });
    }

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
      `${env.SUPABASE_URL}/rest/v1/webhook_logs?id=eq.${encodeURIComponent(logId)}`,
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
      `${env.SUPABASE_URL}/rest/v1/webhook_logs?payment_id=eq.${encodeURIComponent(paymentId)}&webhook_action=eq.${encodeURIComponent(action ?? '')}&status=eq.success&limit=1`,
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

  // ---------------------------------------------------------------------------
  // HARD MONEY GUARDS — validated BEFORE any DB work. No fallbacks: an unexpected
  // amount/currency/live_mode means we refuse to grant access rather than guess.
  // ---------------------------------------------------------------------------

  // #17 live_mode: never create a production subscription from a TEST payment
  // (or vice-versa). MP marks each payment with live_mode true/false.
  const environment = resolveEnvironment(env);
  const expectLive = environment === 'production';
  if (typeof payment.live_mode === 'boolean' && payment.live_mode !== expectLive) {
    throw new WorkerError(
      `live_mode mismatch: payment.live_mode=${payment.live_mode} but environment=${environment}`,
      ErrorType.VALIDATION_ERROR,
      { live_mode: payment.live_mode, environment }
    );
  }

  // #2/#8 amount: must be an EXACT recognized plan price. No PLAN_BASICO fallback.
  const amount = payment.transaction_amount;
  const planConfig = PLAN_CONFIG[amount];
  if (!planConfig) {
    throw new WorkerError(
      `Rejected: transaction_amount ${amount} is not a recognized plan price`,
      ErrorType.VALIDATION_ERROR,
      { amount, valid_amounts: Object.keys(PLAN_CONFIG) }
    );
  }

  // #2/#8 currency: must be COP.
  const currency = payment.currency_id;
  if (currency !== PLAN_CURRENCY) {
    throw new WorkerError(
      `Rejected: currency ${currency} is not ${PLAN_CURRENCY}`,
      ErrorType.VALIDATION_ERROR,
      { currency, amount }
    );
  }

  const planType = planConfig.type;
  const planDays = planConfig.days;
  operations.push({ op: 'money_validated', amount, currency, plan: planType, environment });

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
    user = await supabaseQuery(supabaseUrl, supabaseKey, 'profiles', 'id,email', `id=eq.${encodeURIComponent(userId)}`);
    if (user) userLookupMethod = 'metadata_user_id';
    operations.push({ op: 'user_lookup_metadata', success: !!user, value: userId });
  }

  if (!user && userIdFromRef) {
    user = await supabaseQuery(supabaseUrl, supabaseKey, 'profiles', 'id,email', `id=eq.${encodeURIComponent(userIdFromRef)}`);
    if (user) userLookupMethod = 'external_reference';
    operations.push({ op: 'user_lookup_ref', success: !!user, value: userIdFromRef });
  }

  if (!user && payerEmail) {
    user = await supabaseQuery(supabaseUrl, supabaseKey, 'profiles', 'id,email', `email=eq.${encodeURIComponent(payerEmail)}`);
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

  // planType/planDays already derived from the validated amount above.

  // Check if subscription already exists (idempotency). Match on the SAME key as
  // the UNIQUE index: (payment_provider, payment_reference).
  const paymentRefEnc = encodeURIComponent(String(payment.id));
  const existingSub = await supabaseQuery(
    supabaseUrl, supabaseKey, 'subscriptions', 'id,end_date,plan_type,status',
    `payment_provider=eq.mercadopago&payment_reference=eq.${paymentRefEnc}`
  );

  if (existingSub) {
    operations.push({ op: 'subscription_exists', subscription_id: existingSub.id });

    // #13 Self-healing: the subscription row exists but the profile entitlement
    // may have drifted (e.g. a prior run inserted the sub then failed before the
    // profile update). Idempotently re-assert entitlement — but ONLY if the
    // existing subscription is still active and not expired, so a re-fired
    // webhook for an old payment cannot silently re-activate a lapsed plan.
    const stillActive =
      existingSub.status === 'active' &&
      existingSub.end_date && new Date(existingSub.end_date) > new Date();
    if (stillActive) {
      try {
        await supabaseUpdate(supabaseUrl, supabaseKey, 'profiles', user.id, {
          has_active_subscription: true,
          current_plan: existingSub.plan_type || planType,
          subscription_end_date: existingSub.end_date,
          updated_at: new Date().toISOString(),
        });
        operations.push({ op: 'profile_reassert', success: true });
      } catch (e) {
        operations.push({ op: 'profile_reassert', success: false, error: e.message });
      }
    } else {
      operations.push({ op: 'profile_reassert', skipped: true, reason: 'subscription_not_active' });
    }

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

  // #15 Idempotency: the check-then-insert above still races with a concurrent
  // webhook/reconcile for the same payment. The UNIQUE index on
  // (payment_provider, payment_reference) is the real guard — if we lose the
  // race, the insert returns 23505 (HTTP 409). Treat that as "already processed"
  // and self-heal the profile rather than failing the webhook.
  let subscription;
  try {
    subscription = await supabaseInsert(supabaseUrl, supabaseKey, 'subscriptions', {
      user_id: user.id,
      plan_type: planType,
      status: 'active',
      start_date: new Date().toISOString(),
      end_date: endDate.toISOString(),
      payment_provider: 'mercadopago',
      payment_reference: String(payment.id),
      amount_paid: amount,
    });
  } catch (e) {
    if (e instanceof WorkerError && e.details?.conflict) {
      operations.push({ op: 'subscription_insert_conflict', payment_reference: String(payment.id) });

      const winner = await supabaseQuery(
        supabaseUrl, supabaseKey, 'subscriptions', 'id,end_date,plan_type',
        `payment_provider=eq.mercadopago&payment_reference=eq.${paymentRefEnc}`
      );

      // Re-assert entitlement idempotently (the winning insert may not have
      // reached the profile update yet).
      try {
        await supabaseUpdate(supabaseUrl, supabaseKey, 'profiles', user.id, {
          has_active_subscription: true,
          current_plan: winner?.plan_type || planType,
          subscription_end_date: winner?.end_date || endDate.toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (_) { /* best-effort */ }

      if (webhookLogId) {
        await updateWebhookLog(env, webhookLogId, {
          subscription_id: winner?.id,
          user_id: user.id,
          plan_type: planType,
          supabase_operations: operations,
        });
      }

      return {
        status: 'already_exists',
        subscription_id: winner?.id,
        user_id: user.id,
        plan_type: planType,
      };
    }
    throw e;
  }

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
// PAYMENT RECONCILIATION (self-healing checkout)
// =============================================================================

const RECONCILE_MAX_PAYMENTS = 50;

/**
 * Sweeps MercadoPago approved payments from the last 48h and activates any
 * subscription that the webhook flow missed (webhook lost, worker down, etc).
 * Idempotent: payments with an existing subscription (payment_reference) are skipped.
 */
async function reconcilePayments(env) {
  validateEnvConfig(env);

  // MercadoPago search supports relative date tokens (NOW-XHOURS)
  const searchUrl =
    'https://api.mercadopago.com/v1/payments/search' +
    '?sort=date_created&criteria=desc' +
    '&range=date_created&begin_date=NOW-48HOURS&end_date=NOW' +
    `&status=approved&limit=${RECONCILE_MAX_PAYMENTS}`;

  const response = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new WorkerError(
      `MP payments search failed: ${response.status} ${text.slice(0, 200)}`,
      response.status === 401 || response.status === 403 ? ErrorType.AUTH_ERROR : ErrorType.SERVER_ERROR
    );
  }

  const { results = [] } = await response.json();
  const payments = results.slice(0, RECONCILE_MAX_PAYMENTS);

  const recovered = [];
  const failed = [];
  let checked = 0;

  for (const payment of payments) {
    checked++;
    try {
      // #7 Reconciliation filter: only ever touch payments that are OURS and
      // whose amount is an exact plan price. This prevents the sweep from
      // activating unrelated MP payments on the same account, or payments with a
      // tampered/unexpected amount.
      const ref = payment.external_reference || '';
      if (!ref.startsWith('JCV-') || !PLAN_CONFIG[payment.transaction_amount]) {
        continue;
      }

      // Idempotency guard: skip payments that already have a subscription
      const existingSub = await supabaseQuery(
        env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY,
        'subscriptions', 'id',
        `payment_provider=eq.mercadopago&payment_reference=eq.${encodeURIComponent(String(payment.id))}`
      );
      if (existingSub) continue;

      console.log(`[Reconcile] Orphan approved payment found: ${payment.id} (${payment.payer?.email || 'no email'})`);
      const result = await activateSubscription(payment, env, null);

      recovered.push({
        payment_id: payment.id,
        amount: payment.transaction_amount,
        email: payment.payer?.email || null,
        subscription_id: result.subscription_id,
        plan_type: result.plan_type,
      });
      console.log(`[Reconcile] Recovered payment ${payment.id} -> subscription ${result.subscription_id}`);
    } catch (error) {
      failed.push({
        payment_id: payment.id,
        amount: payment.transaction_amount,
        email: payment.payer?.email || null,
        error: error.message,
      });
      console.error(`[Reconcile] Failed to recover payment ${payment.id}:`, error.message);
    }
  }

  console.log(`[Reconcile] Sweep done: checked=${checked}, recovered=${recovered.length}, failed=${failed.length}`);

  // Nothing anomalous — no alert, no audit row
  if (recovered.length === 0 && failed.length === 0) return;

  const summary = {
    checked,
    recovered,
    failed,
    window: 'NOW-48HOURS',
    ran_at: new Date().toISOString(),
  };

  // Audit trail in Supabase
  await logWebhook(env, {
    status: 'reconciliation',
    webhook_type: 'reconciliation',
    webhook_action: 'payment.reconcile',
    raw_payload: summary,
    error_message: failed.length > 0 ? `${failed.length} payment(s) could not be recovered` : null,
    processed_at: new Date().toISOString(),
  });

  // WhatsApp alert to trainer
  const lines = ['*Reconciliacion de pagos*'];
  for (const r of recovered) {
    lines.push(`Recuperado: pago ${r.payment_id} (${r.email || 's/email'}) -> ${r.plan_type}`);
  }
  for (const f of failed) {
    lines.push(`FALLO: pago ${f.payment_id} (${f.email || 's/email'}) - ${f.error}`);
  }
  const message = lines.join('\n');

  if (!env.CALLMEBOT_API_KEY || !env.TRAINER_WHATSAPP) {
    console.log('[Reconcile] WhatsApp not configured, alert would be:', message);
    return;
  }

  try {
    await sendWhatsApp(env, message);
    console.log('[Reconcile] WhatsApp alert sent');
  } catch (e) {
    console.error('[Reconcile] WhatsApp alert failed:', e.message);
  }
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
    // 409 / 23505 = unique constraint violation. Surface as a recoverable
    // "conflict" so callers can treat it as an idempotent duplicate (#15).
    if (response.status === 409 || error.includes('23505') || error.includes('duplicate key')) {
      throw new WorkerError(`Supabase insert conflict: ${error}`, ErrorType.VALIDATION_ERROR, {
        conflict: true,
        code: '23505',
      });
    }
    console.error('[Supabase] Insert error:', error);
    throw new WorkerError(`Supabase insert failed: ${error}`, ErrorType.SERVER_ERROR);
  }

  const result = await response.json();
  return result?.[0] || null;
}

async function supabaseUpdate(url, key, table, id, data) {
  const response = await fetch(
    `${url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`,
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

    // #2/#8 Never trust client-sent price/quantity/currency. The plan the client
    // asked for determines the amount, server-side, from PLAN_PRICES.
    const unitPrice = PLAN_PRICES[planType];
    if (!unitPrice) {
      return new Response(JSON.stringify({
        error: 'Invalid planType',
        details: `planType must be one of: ${Object.keys(PLAN_PRICES).join(', ')}`,
      }), {
        status: 400,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // items is still accepted for display metadata (title/description) only —
    // it CANNOT influence price, quantity, or currency.
    const displayItem = Array.isArray(items) && items[0] ? items[0] : {};

    // Determine URLs
    const isProduction = origin.includes('jcv24fitness.com');
    const baseUrl = isProduction ? 'https://jcv24fitness.com' : origin;
    const requestUrl = new URL(request.url);
    const workerUrl = env.WORKER_URL || `https://${requestUrl.hostname}`;

    // Build preference — price/quantity/currency are server-authoritative.
    const preferenceData = {
      items: [{
        id: planType,
        title: displayItem.title || planType,
        description: displayItem.description || '',
        quantity: 1,
        currency_id: PLAN_CURRENCY,
        unit_price: unitPrice,
      }],
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
        plan_type: planType,
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
      fetch(`${supabaseUrl}/rest/v1/training_slots?id=eq.${encodeURIComponent(record.slot_id)}&select=title,slot_date,start_time,end_time`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      }),
      fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(record.user_id)}&select=full_name,email`, {
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
