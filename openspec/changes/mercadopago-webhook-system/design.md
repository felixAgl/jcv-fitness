# Design: MercadoPago Webhook System

## Architecture

```
┌─────────────────┐     ┌──────────────────────────┐     ┌───────────────────┐
│  MercadoPago    │────▶│  Cloudflare Worker       │────▶│  Supabase         │
│  Payment System │     │  mercadopago-jcv         │     │  Database         │
└─────────────────┘     └──────────────────────────┘     └───────────────────┘
        │                         │                              │
        │                         ▼                              │
        │               ┌──────────────────┐                     │
        │               │  MercadoPago API │                     │
        │               │  /v1/payments    │                     │
        │               └──────────────────┘                     │
        │                         │                              │
        │                         ▼                              │
        │               ┌──────────────────┐                     │
        │               │  Tables:         │◀────────────────────┘
        │               │  - webhook_logs  │
        │               │  - subscriptions │
        │               │  - profiles      │
        │               │  - audit_log     │
        │               └──────────────────┘
```

## Component Design

### Cloudflare Worker: `mercadopago-jcv`

**URL:** `https://mercadopago-jcv.fagal142010.workers.dev`

**Endpoints:**
- `POST /` - Create MercadoPago preference
- `POST /webhook` - Receive payment notifications
- `GET /webhook` - Health check

**Secrets:**
- `MP_ACCESS_TOKEN` - MercadoPago API token
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key

### Flow: Webhook Processing

```
1. RECEIVE webhook from MercadoPago
   └─▶ Parse JSON body
   └─▶ Log to webhook_logs (status: received)

2. VALIDATE notification type
   └─▶ Check type === "payment" or action includes "payment"
   └─▶ If not payment, log (status: ignored) and return 200

3. CHECK idempotency
   └─▶ Query webhook_logs for existing success with same payment_id + action
   └─▶ If exists, log (status: ignored, is_duplicate: true) and return 200

4. FETCH payment from MercadoPago API
   └─▶ GET /v1/payments/{id}
   └─▶ Log response in mp_api_response
   └─▶ If fetch fails, log (status: failed) and return 500

5. VALIDATE payment status
   └─▶ Check status === "approved"
   └─▶ If not approved, log (status: ignored) and return 200

6. FIND user
   └─▶ Try: metadata.user_id
   └─▶ Try: external_reference (JCV-timestamp-userId)
   └─▶ Try: payer.email
   └─▶ If not found, log (status: failed) and return 500

7. CREATE subscription
   └─▶ Check if subscription exists for payment_reference
   └─▶ If exists, log (status: ignored) and return 200
   └─▶ Insert into subscriptions table
   └─▶ Update profiles table

8. LOG success
   └─▶ Update webhook_logs (status: success)
   └─▶ Insert subscription_audit_log
   └─▶ Return 200 with subscription details
```

### Database Schema

```sql
-- Already exists
TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  has_active_subscription BOOLEAN,
  current_plan TEXT,
  subscription_end_date TIMESTAMPTZ
)

-- Already exists
TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  plan_type TEXT,
  status TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  payment_provider TEXT,
  payment_reference TEXT,
  amount_paid INTEGER
)

-- New
TABLE webhook_logs (
  id UUID PRIMARY KEY,
  payment_id BIGINT,
  webhook_type TEXT,
  webhook_action TEXT,
  raw_payload JSONB,
  status TEXT CHECK (status IN ('received', 'processing', 'success', 'failed', 'ignored')),
  ... (see spec for full schema)
)

-- New
TABLE subscription_audit_log (
  id UUID PRIMARY KEY,
  subscription_id UUID,
  user_id UUID,
  operation TEXT CHECK (operation IN ('created', 'activated', 'updated', 'deactivated', 'expired', 'refunded')),
  ... (see spec for full schema)
)
```

## Error Handling

| Error | Response | Log Status | Retry? |
|-------|----------|------------|--------|
| Invalid JSON | 400 | failed | No |
| Not payment type | 200 | ignored | No |
| Duplicate webhook | 200 | ignored | No |
| MercadoPago API down | 500 | failed | Yes* |
| Payment not approved | 200 | ignored | No |
| User not found | 500 | failed | No |
| Supabase error | 500 | failed | Yes* |

*MercadoPago will retry failed webhooks automatically

## Security Considerations

1. **Service Role Key**: Used to bypass RLS for webhook operations
2. **No secrets in code**: All secrets stored in Cloudflare Worker secrets
3. **Idempotency**: Prevents duplicate subscription activations
4. **Audit trail**: All operations logged for compliance

## Performance

- Target processing time: < 5 seconds
- Actual observed: ~1-2 seconds
- Bottleneck: MercadoPago API call (~500-800ms)
