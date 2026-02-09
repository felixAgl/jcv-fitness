# Spec: useSubscription Hook

## Overview
React hook that provides subscription state and actions to components.

## Requirements

### REQ-1: State Management
- **MUST** track current subscription
- **MUST** track loading state
- **MUST** track error state
- **MUST** calculate hasActiveSubscription
- **MUST** calculate daysRemaining

### REQ-2: Data Loading
- **MUST** load subscription on mount
- **MUST** depend on user from AuthContext
- **MUST** handle unauthenticated state
- **MUST** provide refresh function

### REQ-3: Actions
- **MUST** expose createSubscription function
- **MUST** expose cancelSubscription function
- **MUST** update state after mutations

### REQ-4: Profile Integration
- **MUST** use profile.has_active_subscription for quick check
- **MUST** fetch full subscription for details
- **MUST** sync with auth context profile

## Interface

```typescript
interface UseSubscriptionReturn {
  // State
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  hasActiveSubscription: boolean;
  daysRemaining: number;

  // Actions
  createSubscription: (params: CreateParams) => Promise<Subscription>;
  cancelSubscription: () => Promise<void>;
  refresh: () => Promise<void>;
}

function useSubscription(): UseSubscriptionReturn;
```

## Implementation Details

### Days Remaining Calculation
```typescript
const daysRemaining = subscription
  ? Math.max(0, Math.ceil(
      (new Date(subscription.end_date).getTime() - Date.now())
      / (1000 * 60 * 60 * 24)
    ))
  : 0;
```

### Has Active Subscription
```typescript
// Fast check from profile (already loaded)
const hasActiveSubscription = profile?.has_active_subscription ?? false;
```

### Loading Flow
```typescript
useEffect(() => {
  if (!user) {
    setSubscription(null);
    setIsLoading(false);
    return;
  }

  loadSubscription();
}, [user]);

const loadSubscription = async () => {
  setIsLoading(true);
  try {
    const sub = await subscriptionService.getActiveSubscription(user.id);
    setSubscription(sub);
    setError(null);
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};
```

## Scenarios

### Scenario: Hook Mount - Authenticated User
```gherkin
Given a user is authenticated
When useSubscription mounts
Then isLoading should be true initially
And subscription data should be fetched
And isLoading should become false
And subscription should contain user's active subscription or null
```

### Scenario: Hook Mount - Unauthenticated User
```gherkin
Given no user is authenticated
When useSubscription mounts
Then subscription should be null
And isLoading should be false
And hasActiveSubscription should be false
```

### Scenario: Days Remaining Calculation
```gherkin
Given a subscription ending in 15 days
When daysRemaining is accessed
Then it should return 15
```

### Scenario: Expired Subscription
```gherkin
Given a subscription that ended yesterday
When daysRemaining is accessed
Then it should return 0
And hasActiveSubscription should be false
```

## Usage Example

```tsx
function SubscriptionStatus() {
  const {
    subscription,
    isLoading,
    hasActiveSubscription,
    daysRemaining
  } = useSubscription();

  if (isLoading) return <Spinner />;

  if (!hasActiveSubscription) {
    return <UpgradePrompt />;
  }

  return (
    <div>
      <p>Plan: {subscription.plan_type}</p>
      <p>Days remaining: {daysRemaining}</p>
    </div>
  );
}
```
