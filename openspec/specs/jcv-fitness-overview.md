# JCV 24 Fitness - System Overview

## Product Description
JCV 24 Fitness is a fitness platform that provides personalized nutrition and workout plans to help users transform their bodies.

## Tech Stack

### Frontend
- **Framework:** Next.js 16.1.4 (Static Export)
- **UI:** React 19, Tailwind CSS
- **Hosting:** Cloudflare Pages (jcv24fitness.com)

### Backend
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (Magic Links)
- **Payments:** MercadoPago (Colombia)
- **Serverless:** Cloudflare Workers

### Infrastructure
- **Domain:** jcv24fitness.com
- **CDN:** Cloudflare
- **CI/CD:** GitHub → Cloudflare Pages (auto-deploy)

## Core Features

### 1. User Authentication
- Magic link email authentication via Supabase
- Profile management
- Password reset flow

### 2. Subscription Plans
| Plan | Price (COP) | Duration | Features |
|------|-------------|----------|----------|
| PLAN_BASICO | $49,900 | 40 days | Basic nutrition + workout plan |
| PLAN_PRO | $89,900 | 40 days | Pro nutrition + advanced workouts |
| PLAN_PREMIUM | $149,900 | 40 days | Premium full-service coaching |

### 3. Payment Processing
- MercadoPago Checkout Pro integration
- Cloudflare Worker handles preference creation
- Webhook-based automatic subscription activation
- Full audit trail in Supabase

### 4. Plan Generation (Wizard)
- User completes profile wizard with:
  - Physical stats (height, weight, age)
  - Goals (lose weight, gain muscle, etc.)
  - Dietary preferences
- AI generates personalized plans
- PDF download for paid subscribers

## Database Schema

### Core Tables
```
profiles
├── id (UUID, PK)
├── email (TEXT)
├── full_name (TEXT)
├── has_active_subscription (BOOLEAN)
├── current_plan (TEXT: PLAN_BASICO | PLAN_PRO | PLAN_PREMIUM)
├── subscription_end_date (TIMESTAMPTZ)
└── ...

subscriptions
├── id (UUID, PK)
├── user_id (UUID, FK → profiles)
├── plan_type (TEXT)
├── status (TEXT: active | expired | cancelled)
├── start_date (TIMESTAMPTZ)
├── end_date (TIMESTAMPTZ)
├── payment_provider (TEXT: mercadopago | wompi)
├── payment_reference (TEXT)
└── amount_paid (INTEGER)

webhook_logs
├── id (UUID, PK)
├── payment_id (BIGINT)
├── status (TEXT: received | processing | success | failed | ignored)
├── ... (see mercadopago-webhook-system spec)

subscription_audit_log
├── id (UUID, PK)
├── subscription_id (UUID)
├── operation (TEXT: created | activated | updated | ...)
└── ... (see mercadopago-webhook-system spec)

wizard_data
├── id (UUID, PK)
├── user_id (UUID, FK → profiles)
├── data (JSONB)
└── ...

user_plans
├── id (UUID, PK)
├── user_id (UUID, FK → profiles)
├── plan_data (JSONB)
├── plan_type (TEXT: free | paid)
└── ...
```

## External Services

### MercadoPago
- **Dashboard:** https://www.mercadopago.com.co/developers
- **Webhook URL:** https://mercadopago-jcv.fagal142010.workers.dev/webhook
- **Events:** Pagos, Alertas de fraude, Contracargos, Reclamos

### Supabase
- **Project:** chqgylghpuzcqzkbuhsk
- **Region:** us-west-2
- **Dashboard:** https://supabase.com/dashboard/project/chqgylghpuzcqzkbuhsk

### Cloudflare
- **Worker:** mercadopago-jcv
- **Pages:** jcv-fitness

## Environment Variables

### Next.js (Client)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_MP_WORKER_URL`

### Cloudflare Worker (Secrets)
- `MP_ACCESS_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

## Key URLs
- **Production:** https://jcv24fitness.com
- **Staging:** https://staging.jcv-fitness.pages.dev
- **Worker:** https://mercadopago-jcv.fagal142010.workers.dev
