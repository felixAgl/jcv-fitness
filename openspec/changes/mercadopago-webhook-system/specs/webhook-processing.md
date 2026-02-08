# Spec: Webhook Processing

## Overview
The webhook endpoint must handle MercadoPago payment notifications reliably.

## Requirements

### REQ-1: Webhook Endpoint
- **MUST** expose `POST /webhook` endpoint
- **MUST** respond to `GET /webhook` with health status
- **MUST** accept `application/json` content type
- **MUST** return 200 status for all received webhooks (even if ignored)

### REQ-2: Payment Type Filtering
- **MUST** process `type: "payment"` notifications
- **MUST** process `action: "payment.created"` and `action: "payment.updated"`
- **MUST** ignore non-payment notifications (merchant_order, etc.)
- **MUST** log ignored notifications with reason

### REQ-3: Payment Validation
- **MUST** fetch payment details from MercadoPago API
- **MUST** use `MP_ACCESS_TOKEN` for authentication
- **MUST** validate payment `status === "approved"` before activation
- **MUST** log non-approved payments without activating

### REQ-4: User Identification
- **MUST** find user by (in order):
  1. `payment.metadata.user_id`
  2. `external_reference` (format: `JCV-{timestamp}-{userId}`)
  3. `payment.payer.email`
- **MUST** fail gracefully if user not found
- **MUST** log which method was used to find user

### REQ-5: Plan Determination
- **MUST** determine plan from `transaction_amount`:
  - 49900 COP → PLAN_BASICO (40 days)
  - 89900 COP → PLAN_PRO (40 days)
  - 149900 COP → PLAN_PREMIUM (40 days)
- **SHOULD** fallback to `metadata.plan_type` if amount not recognized
- **SHOULD** default to PLAN_BASICO if no plan can be determined

## Scenarios

### Scenario: Successful Payment Activation
```gherkin
Given a user "john@example.com" exists in the system
And the user has no active subscription
When MercadoPago sends webhook for approved payment of 49900 COP
Then a subscription should be created with plan "PLAN_BASICO"
And the user profile should be updated with has_active_subscription = true
And a webhook_log entry should be created with status "success"
And a subscription_audit_log entry should be created with operation "activated"
```

### Scenario: Duplicate Webhook
```gherkin
Given a payment was already processed successfully
When MercadoPago sends the same webhook again
Then no new subscription should be created
And a webhook_log entry should be created with status "ignored" and is_duplicate = true
```

### Scenario: Pending Payment
```gherkin
Given a user makes a payment
When MercadoPago sends webhook with status "pending"
Then no subscription should be created
And a webhook_log entry should be created with status "ignored"
And the response should include the payment status
```

### Scenario: User Not Found
```gherkin
Given no user exists for the payer email
And no user_id in metadata or external_reference
When MercadoPago sends webhook for approved payment
Then no subscription should be created
And a webhook_log entry should be created with status "failed"
And error_details should contain all lookup attempts
```
