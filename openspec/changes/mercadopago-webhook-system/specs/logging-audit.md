# Spec: Logging and Audit Trail

## Overview
All webhook events and subscription changes must be logged for debugging and compliance.

## Requirements

### REQ-1: Webhook Logging
- **MUST** log every webhook receipt immediately
- **MUST** capture raw payload and headers
- **MUST** track processing status: received → processing → success/failed/ignored
- **MUST** record processing time in milliseconds

### REQ-2: Webhook Log Fields
```
webhook_logs:
  - id: UUID
  - payment_id: BIGINT
  - webhook_type: TEXT
  - webhook_action: TEXT
  - raw_payload: JSONB
  - headers: JSONB
  - status: 'received' | 'processing' | 'success' | 'failed' | 'ignored'
  - error_message: TEXT
  - error_details: JSONB
  - user_id: UUID (nullable)
  - user_email: TEXT (nullable)
  - subscription_id: UUID (nullable)
  - payment_status: TEXT
  - payment_amount: INTEGER
  - plan_type: TEXT
  - is_duplicate: BOOLEAN
  - duplicate_of: UUID (nullable)
  - received_at: TIMESTAMPTZ
  - processed_at: TIMESTAMPTZ
  - processing_time_ms: INTEGER
  - mp_api_response: JSONB
  - supabase_operations: JSONB
```

### REQ-3: Subscription Audit Log
- **MUST** log all subscription state changes
- **MUST** capture before/after state
- **MUST** record trigger source and reference

### REQ-4: Audit Log Fields
```
subscription_audit_log:
  - id: UUID
  - subscription_id: UUID
  - user_id: UUID
  - operation: 'created' | 'activated' | 'updated' | 'deactivated' | 'expired' | 'refunded'
  - old_data: JSONB
  - new_data: JSONB
  - trigger_source: TEXT
  - trigger_reference: TEXT
  - metadata: JSONB
  - created_at: TIMESTAMPTZ
```

### REQ-5: Idempotency
- **MUST** check for existing successful webhook with same payment_id and action
- **MUST** mark duplicate webhooks with `is_duplicate = true`
- **MUST** reference original log in `duplicate_of` field

## Scenarios

### Scenario: Complete Webhook Log
```gherkin
When a webhook is received
Then a log entry should be created with status "received"
And the raw_payload should contain the full webhook body
And the headers should contain request headers
And received_at should be set to current timestamp
```

### Scenario: Failed Webhook Log
```gherkin
When a webhook fails to process
Then the log entry should be updated with status "failed"
And error_message should describe the failure
And error_details should contain stack trace and context
And processed_at should be set
And processing_time_ms should be calculated
```

### Scenario: Subscription Audit Trail
```gherkin
When a subscription is activated
Then an audit log entry should be created with operation "activated"
And new_data should contain plan_type, status, dates
And trigger_source should be "webhook"
And trigger_reference should be the payment_id
And metadata should include webhook_log_id and user_lookup_method
```
