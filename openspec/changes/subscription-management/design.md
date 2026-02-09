# Design: Subscription Management System

## Architecture

```
+------------------+     +-------------------+     +----------------+
|  Next.js App     |     |  Cloudflare       |     |  MercadoPago   |
|  Pricing Page    |---->|  Worker           |---->|  API           |
|  Checkout Modal  |     |  /preference      |     |  /preferences  |
+------------------+     +-------------------+     +----------------+
        |                        |
        |                        v
        |               +-------------------+
        |               |  MercadoPago      |
        |               |  Checkout         |
        |               +-------------------+
        |                        |
        |                        v (payment)
        |               +-------------------+
        |               |  Webhook Handler  |
        |               |  /webhook         |
        |               +-------------------+
        |                        |
        v                        v
+------------------+     +-------------------+
|  useSubscription |     |  Supabase         |
|  Hook            |<----|  subscriptions    |
|                  |     |  profiles         |
+------------------+     +-------------------+
```

## Subscription Plans

### Plan Configuration

```typescript
const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "PLAN_BASICO",
    name: "Basico",
    durationMonths: 1,
    price: 49900,           // 49,900 COP
    priceDisplay: "$49.900",
    features: [
      "Plan de alimentacion 7 dias",
      "Rutina de entrenamiento casa",
      "Acceso a la app",
      "Soporte por email",
    ],
  },
  {
    id: "PLAN_PRO",
    name: "Pro",
    durationMonths: 1,
    price: 89900,           // 89,900 COP
    priceDisplay: "$89.900",
    popular: true,
    features: [
      "Plan de alimentacion personalizado",
      "Rutina gimnasio + casa",
      "Videos de ejercicios",
      "Soporte prioritario",
      "Seguimiento semanal",
    ],
  },
  {
    id: "PLAN_PREMIUM",
    name: "Premium",
    durationMonths: 1,
    price: 149900,          // 149,900 COP
    priceDisplay: "$149.900",
    features: [
      "Todo lo del plan Pro",
      "Coaching 1 a 1",
      "Ajustes mensuales",
      "Acceso a comunidad VIP",
      "Garantia de resultados",
    ],
  },
];
```

### Plan Duration Mapping

| Plan | Amount (COP) | Duration |
|------|--------------|----------|
| PLAN_BASICO | 49,900 | 40 days |
| PLAN_PRO | 89,900 | 40 days |
| PLAN_PREMIUM | 149,900 | 40 days |

## Database Schema

### Subscriptions Table
```sql
TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  plan_type plan_type NOT NULL,
  status subscription_status DEFAULT 'active',
  start_date TIMESTAMPTZ DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  payment_provider payment_provider,
  payment_reference TEXT,
  amount_paid INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

### Profiles Table (subscription fields)
```sql
-- Subscription-related fields in profiles
has_active_subscription BOOLEAN DEFAULT false,
current_plan plan_type,
subscription_end_date TIMESTAMPTZ
```

### Enums
```sql
CREATE TYPE plan_type AS ENUM ('PLAN_BASICO', 'PLAN_PRO', 'PLAN_PREMIUM');
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled');
CREATE TYPE payment_provider AS ENUM ('mercadopago', 'wompi');
```

## Payment Flow

### Step 1: Create Payment Preference
```
User clicks "Comprar" on plan
    |
    v
Frontend calls Cloudflare Worker POST /
    |
    +-- Body: { plan_type, user_id, user_email }
    |
    v
Worker creates MercadoPago preference
    |
    +-- external_reference: JCV-{timestamp}-{userId}
    +-- notification_url: /webhook
    +-- back_urls: success, failure, pending
    |
    v
Returns { preferenceId, initPoint }
    |
    v
Redirect to MercadoPago checkout
```

### Step 2: Payment Processing
```
User completes payment on MercadoPago
    |
    v
MercadoPago redirects to:
    +-- /payment/success (approved)
    +-- /payment/failure (rejected)
    +-- /payment/pending (pending)
    |
    v
User sees status page
```

### Step 3: Webhook Activation
```
MercadoPago sends webhook to /webhook
    |
    v
Worker validates payment with MercadoPago API
    |
    v
If status === "approved":
    |
    +-- Create subscription in Supabase
    +-- Update profile (has_active_subscription = true)
    +-- Log to webhook_logs
    +-- Log to subscription_audit_log
    |
    v
Return 200 OK
```

## Subscription Service

### Interface
```typescript
interface SubscriptionService {
  getActiveSubscription(userId: string): Promise<Subscription | null>;
  createSubscription(params: CreateSubscriptionParams): Promise<Subscription>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  hasActiveSubscription(userId: string): Promise<boolean>;
}
```

### Days Remaining Calculation
```typescript
const daysRemaining = subscription
  ? Math.max(0, Math.ceil(
      (new Date(subscription.end_date).getTime() - Date.now())
      / (1000 * 60 * 60 * 24)
    ))
  : 0;
```

## useSubscription Hook

### State
```typescript
interface UseSubscriptionState {
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  hasActiveSubscription: boolean;
  daysRemaining: number;
}
```

### Actions
```typescript
interface UseSubscriptionActions {
  createSubscription: (params) => Promise<Subscription>;
  cancelSubscription: () => Promise<void>;
  refresh: () => Promise<void>;
}
```

## UI Components

### PricingSection
- Displays all three plans
- Highlights popular plan (PRO)
- Shows features list
- CTA button per plan

### CheckoutModal
- Triggered on plan selection
- Shows plan summary
- Initiates payment flow
- Handles loading state

### SubscriptionCard (Dashboard)
- Shows current subscription
- Displays days remaining
- Expiration warning (< 7 days)
- Renewal CTA

## Expiration Handling

### Automatic Expiration (Cron)
```sql
-- Function to expire old subscriptions
CREATE FUNCTION expire_old_subscriptions()
RETURNS INTEGER AS $$
  UPDATE subscriptions
  SET status = 'expired', updated_at = now()
  WHERE status = 'active'
    AND end_date < now();

  UPDATE profiles
  SET has_active_subscription = false,
      current_plan = null,
      subscription_end_date = null
  WHERE has_active_subscription = true
    AND subscription_end_date < now();
$$;
```

### Client-Side Check
```typescript
// In SubscriptionCard
const isExpiringSoon = daysRemaining <= 7;

if (isExpiringSoon) {
  // Show warning banner
}
```
