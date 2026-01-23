/**
 * Cloudflare Worker for MercadoPago Preference Creation
 *
 * Deploy this worker to Cloudflare and set the MP_ACCESS_TOKEN secret.
 *
 * Usage:
 * 1. Install Wrangler: npm install -g wrangler
 * 2. Login: wrangler login
 * 3. Create worker: wrangler init mercadopago-jcv
 * 4. Deploy: wrangler deploy
 * 5. Set secret: wrangler secret put MP_ACCESS_TOKEN
 */

const ALLOWED_ORIGINS = [
  'https://felixagl.github.io',
  'http://localhost:3000',
  'http://localhost:5173',
];

const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
});

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    try {
      const body = await request.json();
      const { items, payer, backUrls } = body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return new Response(JSON.stringify({ error: 'Items are required' }), {
          status: 400,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

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
          success: `${origin}/jcv-fitness/payment/success`,
          failure: `${origin}/jcv-fitness/payment/failure`,
          pending: `${origin}/jcv-fitness/payment/pending`,
        },
        auto_return: 'approved',
        statement_descriptor: 'JCV FITNESS',
        external_reference: `JCV-${Date.now()}`,
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
  },
};
