# Spec: usePlan Hook

## Overview
React hook for fetching and managing user's active plan with creation and download tracking capabilities.

## Requirements

### REQ-1: Plan Loading
- **MUST** fetch active plan on mount
- **MUST** depend on authenticated user
- **MUST** call get_active_plan Supabase function
- **MUST** handle loading and error states

### REQ-2: Plan Creation Check
- **MUST** check if user can create new plan
- **MUST** respect free plan limit
- **MUST** provide reason for restriction

### REQ-3: Plan Creation
- **MUST** support creating new plans
- **MUST** handle race condition after login
- **MUST** refresh after creation

### REQ-4: Download Tracking
- **MUST** register downloads
- **MUST** increment download_count
- **MUST** return success/failure

## Interface

```typescript
interface UsePlanState {
  plan: ActivePlan | null;
  isLoading: boolean;
  error: string | null;
  canCreatePlan: boolean;
  canCreateReason?: "already_has_plan" | "free_used" | "not_authenticated";
}

interface UsePlanActions {
  createPlan: (
    planData: WizardState,
    planType?: PlanType
  ) => Promise<{ success: boolean; planId?: string; error?: string }>;
  refreshPlan: () => Promise<void>;
  registerDownload: () => Promise<boolean>;
}

function usePlan(): UsePlanState & UsePlanActions;
```

## Active Plan Structure

```typescript
interface ActivePlan extends UserPlan {
  isExpired: boolean;
  daysRemaining: number;
}
```

## Supabase Function: get_active_plan

```sql
CREATE FUNCTION get_active_plan(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  plan_data JSONB,
  plan_type user_plan_type,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_expired BOOLEAN,
  days_remaining INTEGER,
  download_count INTEGER
) AS $$
  SELECT
    id,
    plan_data,
    plan_type,
    created_at,
    expires_at,
    expires_at < now() AS is_expired,
    GREATEST(0, EXTRACT(DAY FROM expires_at - now())::INTEGER) AS days_remaining,
    download_count
  FROM user_plans
  WHERE user_id = user_uuid
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
$$;
```

## Supabase Function: can_create_plan

```sql
CREATE FUNCTION can_create_plan(user_uuid UUID)
RETURNS TABLE (
  can_create BOOLEAN,
  reason TEXT
) AS $$
  -- Check if user already has active plan
  IF EXISTS (
    SELECT 1 FROM user_plans
    WHERE user_id = user_uuid AND is_active = true
  ) THEN
    RETURN QUERY SELECT false, 'already_has_plan'::TEXT;
    RETURN;
  END IF;

  -- Check if free plan was used
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_uuid AND has_free_plan_used = true
  ) THEN
    RETURN QUERY SELECT false, 'free_used'::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, NULL::TEXT;
$$;
```

## Scenarios

### Scenario: User Has Active Plan
```gherkin
Given a user with an active plan
When usePlan mounts
Then plan should contain the active plan data
And isExpired should be false
And daysRemaining should be positive
And canCreatePlan should be false
And canCreateReason should be "already_has_plan"
```

### Scenario: User Has No Plan
```gherkin
Given a user without any plans
When usePlan mounts
Then plan should be null
And canCreatePlan should be true
And canCreateReason should be undefined
```

### Scenario: Create Plan Success
```gherkin
Given a user who can create a plan
When createPlan is called with wizard data
Then a new plan should be created
And refreshPlan should be called
And plan should contain the new plan
```

### Scenario: Create Plan - Already Has Plan
```gherkin
Given a user with an active plan
When createPlan is called
Then it should return { success: false, error: "Ya tienes un plan activo" }
```

### Scenario: Register Download
```gherkin
Given a user with an active plan
When registerDownload is called
Then download_count should increment
And it should return true
```

## Error Handling

| Error | State Update |
|-------|--------------|
| Network error | error: "Error de conexion" |
| User not found | canCreateReason: "not_authenticated" |
| Database error | error: "Error al cargar el plan" |
