# Tasks: Subscription Management System

## Phase 1: Data Model
- [x] 1.1 Define plan_type enum
- [x] 1.2 Define subscription_status enum
- [x] 1.3 Define payment_provider enum
- [x] 1.4 Create subscriptions table
- [x] 1.5 Add subscription fields to profiles
- [x] 1.6 Create RLS policies

## Phase 2: Plan Configuration
- [x] 2.1 Define SUBSCRIPTION_PLANS constant
- [x] 2.2 Configure pricing per plan
- [x] 2.3 Define features per plan
- [x] 2.4 Add duration configuration
- [x] 2.5 Mark popular plan

## Phase 3: Subscription Service
- [x] 3.1 Create subscription-service.ts
- [x] 3.2 Implement getActiveSubscription
- [x] 3.3 Implement createSubscription
- [x] 3.4 Implement cancelSubscription
- [x] 3.5 Implement hasActiveSubscription

## Phase 4: useSubscription Hook
- [x] 4.1 Create useSubscription hook
- [x] 4.2 Implement state management
- [x] 4.3 Add daysRemaining calculation
- [x] 4.4 Add refresh functionality
- [x] 4.5 Connect to auth context

## Phase 5: Payment Integration
- [x] 5.1 Set up Cloudflare Worker
- [x] 5.2 Implement preference creation endpoint
- [x] 5.3 Configure MercadoPago credentials
- [x] 5.4 Handle back URLs

## Phase 6: Webhook Handling
- [x] 6.1 Create webhook endpoint
- [x] 6.2 Validate payment status
- [x] 6.3 Create subscription on approval
- [x] 6.4 Update profile on activation
- [x] 6.5 Handle idempotency

## Phase 7: UI Components
- [x] 7.1 Create PricingSection
- [x] 7.2 Create PricingCard component
- [x] 7.3 Create CheckoutModal
- [x] 7.4 Create SubscriptionCard (dashboard)
- [x] 7.5 Add expiration warning

## Phase 8: Payment Status Pages
- [x] 8.1 Create /payment/success page
- [x] 8.2 Create /payment/failure page
- [x] 8.3 Create /payment/pending page

## Phase 9: Expiration Handling
- [x] 9.1 Create expire_old_subscriptions function
- [x] 9.2 Set up cron job (Supabase)
- [x] 9.3 Add expiration warnings in UI

## Phase 10: Testing
- [x] 10.1 Unit tests for subscription service
- [x] 10.2 Unit tests for useSubscription hook
- [x] 10.3 Webhook integration tests
- [ ] 10.4 E2E payment flow tests

## Pending Improvements
- [ ] Add automatic renewal option
- [ ] Implement refund handling
- [ ] Add Wompi payment provider
- [ ] Email notifications on activation
- [ ] Email reminders before expiration
- [ ] Admin dashboard for subscription management
