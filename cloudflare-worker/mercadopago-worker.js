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

/**
 * Handle MercadoPago webhook notifications
 */
async function handleWebhook(request, env, origin) {
  // Webhooks come from MercadoPago, not browser - allow any origin
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

  try {
    const body = await request.json();
    console.log('[Webhook] Received:', JSON.stringify(body));

    const { type, data, action } = body;

    // Only process payment notifications
    if (type !== 'payment' && action !== 'payment.updated' && action !== 'payment.created') {
      console.log('[Webhook] Ignoring non-payment notification:', type, action);
      return new Response(JSON.stringify({ received: true, ignored: true }), {
        status: 200,
        headers,
      });
    }

    const paymentId = data?.id;
    if (!paymentId) {
      console.error('[Webhook] No payment ID');
      return new Response(JSON.stringify({ error: 'No payment ID' }), {
        status: 400,
        headers,
      });
    }

    // Fetch payment details from MercadoPago
    const payment = await fetchPaymentDetails(paymentId, env.MP_ACCESS_TOKEN);
    if (!payment) {
      console.error('[Webhook] Could not fetch payment');
      return new Response(JSON.stringify({ error: 'Could not fetch payment' }), {
        status: 500,
        headers,
      });
    }

    console.log('[Webhook] Payment:', {
      id: payment.id,
      status: payment.status,
      amount: payment.transaction_amount,
      external_reference: payment.external_reference,
      payer_email: payment.payer?.email,
    });

    // Only process approved payments
    if (payment.status !== 'approved') {
      console.log('[Webhook] Payment not approved:', payment.status);
      return new Response(JSON.stringify({
        received: true,
        status: payment.status,
        message: 'Payment not approved yet'
      }), {
        status: 200,
        headers,
      });
    }

    // Activate subscription
    const result = await activateSubscription(payment, env);

    return new Response(JSON.stringify({
      received: true,
      processed: true,
      subscription: result
    }), {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('[Webhook] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', message: error.message }), {
      status: 500,
      headers,
    });
  }
}

/**
 * Fetch payment details from MercadoPago API
 */
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

/**
 * Activate subscription in Supabase
 */
async function activateSubscription(payment, env) {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[Webhook] Supabase credentials not configured');
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

  // Find user by: 1) metadata user_id, 2) external_reference user_id, 3) payer email
  let user = null;

  if (userId) {
    user = await supabaseQuery(supabaseUrl, supabaseKey, 'profiles', 'id,email', `id=eq.${userId}`);
  }

  if (!user && userIdFromRef) {
    user = await supabaseQuery(supabaseUrl, supabaseKey, 'profiles', 'id,email', `id=eq.${userIdFromRef}`);
  }

  if (!user && payerEmail) {
    user = await supabaseQuery(supabaseUrl, supabaseKey, 'profiles', 'id,email', `email=eq.${payerEmail}`);
  }

  if (!user) {
    console.error('[Webhook] User not found:', { external_reference: externalRef, payer_email: payerEmail, metadata_user_id: userId });
    throw new Error('User not found');
  }

  console.log('[Webhook] Found user:', user.email);

  // Determine plan type from amount
  const amount = payment.transaction_amount;
  const planConfig = PLAN_CONFIG[amount];

  const planType = planConfig?.type || payment.metadata?.plan_type || 'PLAN_BASICO';
  const planDays = planConfig?.days || 40;

  // Check if subscription already exists
  const existingSub = await supabaseQuery(
    supabaseUrl, supabaseKey, 'subscriptions', 'id', `payment_reference=eq.${payment.id}`
  );

  if (existingSub) {
    console.log('[Webhook] Subscription already exists:', payment.id);
    return { status: 'already_exists', subscription_id: existingSub.id };
  }

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

  // Update user profile
  await supabaseUpdate(supabaseUrl, supabaseKey, 'profiles', user.id, {
    has_active_subscription: true,
    current_plan: planType,
    subscription_end_date: endDate.toISOString(),
    updated_at: new Date().toISOString(),
  });

  console.log('[Webhook] Subscription activated:', {
    user: user.email,
    plan: planType,
    subscription_id: subscription?.id,
    expires: endDate.toISOString(),
  });

  return {
    status: 'activated',
    subscription_id: subscription?.id,
    plan_type: planType,
    expires: endDate.toISOString(),
  };
}

/**
 * Supabase REST API helpers
 */
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

/**
 * Handle preference creation (original functionality)
 */
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

    // Worker URL for webhook (this worker handles webhooks now)
    const workerUrl = 'https://mercadopago-jcv.fagal142010.workers.dev';

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
      // Webhook URL points to THIS worker
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
