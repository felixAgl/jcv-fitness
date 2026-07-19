-- =============================================================================
-- CANCEL SUBSCRIPTION RPC (SECURITY DEFINER, auth.uid()-scoped)
-- =============================================================================
-- Migration: 20260718130000_cancel_subscription_rpc
-- Author:    payment security audit remediation (follow-up to RLS lockdown)
--
-- WHY: The RLS lockdown (20260718120000_security_rls_lockdown.sql) removes the
-- client's ability to UPDATE subscriptions.status directly and blocks client
-- writes to the profiles entitlement columns (has_active_subscription,
-- current_plan, subscription_end_date) via the trg_profiles_protect_entitlements
-- trigger. Cancellation therefore needs a trusted SERVER path.
--
-- This function is that path. It runs SECURITY DEFINER (as the owner, so
-- current_user is NOT 'authenticated'/'anon' and the entitlement-protection
-- trigger allows the profile reset), but it authorizes strictly against
-- auth.uid(): a caller may only ever cancel a subscription they own. The
-- p_subscription_id argument is validated against the caller's identity — it
-- cannot be used to cancel another user's subscription.
--
-- Returns:
--   TRUE  — the caller owned the subscription and it was cancelled.
--   FALSE — no such subscription, or it is not owned by the caller, or the
--           caller is unauthenticated. (No error is raised so the client can
--           map FALSE to a "not found" without leaking existence.)
--
-- IDEMPOTENT: CREATE OR REPLACE + re-granted privileges. Safe to re-run.
--
-- ORDER: apply AFTER 20260718120000_security_rls_lockdown.sql (it relies on the
-- entitlement trigger and the own-row policies defined there).
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.cancel_subscription(p_subscription_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_owner uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Ownership check: only ever act on a subscription belonging to the caller.
  SELECT user_id INTO v_owner
  FROM public.subscriptions
  WHERE id = p_subscription_id;

  IF v_owner IS NULL OR v_owner <> v_uid THEN
    RETURN FALSE;
  END IF;

  UPDATE public.subscriptions
  SET status = 'cancelled',
      updated_at = now()
  WHERE id = p_subscription_id
    AND user_id = v_uid;

  -- Reset the profile entitlement only when the caller has no OTHER active,
  -- non-expired subscription. Running as SECURITY DEFINER, current_user is the
  -- function owner, so the entitlement-protection trigger permits this write.
  IF NOT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = v_uid
      AND status = 'active'
      AND end_date > now()
      AND id <> p_subscription_id
  ) THEN
    UPDATE public.profiles
    SET has_active_subscription = FALSE,
        current_plan = NULL,
        subscription_end_date = NULL,
        updated_at = now()
    WHERE id = v_uid;
  END IF;

  RETURN TRUE;
END;
$$;

-- Only authenticated users (acting for themselves) and the service role may run
-- this. anon and PUBLIC are explicitly revoked.
REVOKE EXECUTE ON FUNCTION public.cancel_subscription(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.cancel_subscription(uuid) TO authenticated, service_role;

COMMIT;
