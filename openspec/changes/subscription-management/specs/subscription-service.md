# Spec: Subscription Service

## Overview
The subscription service handles all database operations for subscription management.

## Requirements

### REQ-1: Get Active Subscription
- **MUST** query by user_id
- **MUST** filter by status = 'active'
- **MUST** check end_date > now()
- **MUST** return null if no active subscription

### REQ-2: Create Subscription
- **MUST** require userId, planType, amountPaid
- **MUST** calculate end_date (40 days from now)
- **MUST** set status = 'active'
- **MUST** update profile.has_active_subscription

### REQ-3: Cancel Subscription
- **MUST** set status = 'cancelled'
- **MUST** update profile.has_active_subscription = false
- **MUST** preserve end_date for record

### REQ-4: Profile Sync
- **MUST** update profile on subscription create
- **MUST** set has_active_subscription = true
- **MUST** set current_plan to plan_type
- **MUST** set subscription_end_date

## Interface

```typescript
interface SubscriptionService {
  getActiveSubscription(userId: string): Promise<Subscription | null>;

  createSubscription(params: {
    userId: string;
    planType: PlanType;
    paymentProvider: PaymentProvider;
    paymentReference: string;
    amountPaid: number;
  }): Promise<Subscription>;

  cancelSubscription(subscriptionId: string): Promise<void>;

  hasActiveSubscription(userId: string): Promise<boolean>;
}
```

## Database Queries

### Get Active Subscription
```typescript
const { data } = await supabase
  .from("subscriptions")
  .select("*")
  .eq("user_id", userId)
  .eq("status", "active")
  .gt("end_date", new Date().toISOString())
  .order("created_at", { ascending: false })
  .limit(1)
  .single();
```

### Create Subscription
```typescript
const endDate = new Date();
endDate.setDate(endDate.getDate() + 40);

const { data: subscription } = await supabase
  .from("subscriptions")
  .insert({
    user_id: userId,
    plan_type: planType,
    status: "active",
    start_date: new Date().toISOString(),
    end_date: endDate.toISOString(),
    payment_provider: paymentProvider,
    payment_reference: paymentReference,
    amount_paid: amountPaid,
  })
  .select()
  .single();

// Update profile
await supabase
  .from("profiles")
  .update({
    has_active_subscription: true,
    current_plan: planType,
    subscription_end_date: endDate.toISOString(),
  })
  .eq("id", userId);
```

### Cancel Subscription
```typescript
await supabase
  .from("subscriptions")
  .update({
    status: "cancelled",
    updated_at: new Date().toISOString(),
  })
  .eq("id", subscriptionId);

const { data: sub } = await supabase
  .from("subscriptions")
  .select("user_id")
  .eq("id", subscriptionId)
  .single();

await supabase
  .from("profiles")
  .update({
    has_active_subscription: false,
    current_plan: null,
    subscription_end_date: null,
  })
  .eq("id", sub.user_id);
```

## Scenarios

### Scenario: User Has No Subscription
```gherkin
Given a user with no subscription records
When getActiveSubscription is called
Then it should return null
And hasActiveSubscription should return false
```

### Scenario: User Has Expired Subscription
```gherkin
Given a user with a subscription where end_date < now
When getActiveSubscription is called
Then it should return null
And hasActiveSubscription should return false
```

### Scenario: Create New Subscription
```gherkin
Given a user without an active subscription
When createSubscription is called with PLAN_PRO
Then a new subscription record should be created
And profile.has_active_subscription should be true
And profile.current_plan should be "PLAN_PRO"
And end_date should be 40 days from now
```

### Scenario: Cancel Active Subscription
```gherkin
Given a user with an active subscription
When cancelSubscription is called
Then subscription.status should be "cancelled"
And profile.has_active_subscription should be false
And profile.current_plan should be null
```

## Error Handling

| Error | Handling |
|-------|----------|
| User not found | Throw "User not found" |
| Subscription not found | Throw "Subscription not found" |
| Already has active | Log and return existing |
| Database error | Propagate with context |
