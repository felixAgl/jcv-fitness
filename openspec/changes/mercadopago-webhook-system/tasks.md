# Tasks: MercadoPago Webhook System

## Phase 1: Database Setup
- [x] 1.1 Create `webhook_logs` table with all required fields
- [x] 1.2 Create indexes for common queries (payment_id, user_id, status)
- [x] 1.3 Enable RLS with service role policy
- [x] 1.4 Create `subscription_audit_log` table
- [x] 1.5 Create indexes for audit queries

## Phase 2: Worker Implementation
- [x] 2.1 Add webhook endpoint routing (`/webhook`)
- [x] 2.2 Implement webhook logging on receipt
- [x] 2.3 Implement notification type filtering
- [x] 2.4 Implement idempotency check
- [x] 2.5 Implement MercadoPago API call
- [x] 2.6 Implement user lookup (3 methods)
- [x] 2.7 Implement subscription creation
- [x] 2.8 Implement profile update
- [x] 2.9 Implement audit logging
- [x] 2.10 Implement error handling and status updates

## Phase 3: Configuration
- [x] 3.1 Add `SUPABASE_URL` secret to worker
- [x] 3.2 Add `SUPABASE_SERVICE_KEY` secret to worker
- [x] 3.3 Configure webhook URL in MercadoPago dashboard
- [x] 3.4 Deploy updated worker

## Phase 4: Testing
- [x] 4.1 Test webhook GET endpoint (health check)
- [x] 4.2 Test webhook POST with invalid payment ID
- [x] 4.3 Test webhook POST with real payment ID (refunded status)
- [x] 4.4 Verify logs are created in `webhook_logs` table
- [ ] 4.5 Test with real approved payment (E2E)
- [ ] 4.6 Verify subscription created correctly
- [ ] 4.7 Verify audit log created correctly

## Phase 5: Documentation
- [x] 5.1 Create OpenSpec proposal
- [x] 5.2 Create webhook processing spec
- [x] 5.3 Create logging/audit spec
- [x] 5.4 Create design document
- [x] 5.5 Create tasks checklist

## Pending Items
- [ ] Handle `payment.refunded` action for subscription cancellation
- [ ] Add email notification on subscription activation
- [ ] Create admin dashboard for viewing logs
- [ ] Add retry logic for failed Supabase operations
