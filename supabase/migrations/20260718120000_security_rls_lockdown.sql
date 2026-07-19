-- =============================================================================
-- SECURITY HOTFIX — RLS LOCKDOWN
-- =============================================================================
-- Migration: 20260718120000_security_rls_lockdown
-- Author:    payment security audit remediation
--
-- WHY: A payment audit found that clients could self-grant entitlements and that
-- audit/log tables were world-accessible. This migration closes those holes.
-- It is written against the CURRENT LIVE policy state (inspected read-only via
-- pg_policies), NOT the drifted repo migrations. It is IDEMPOTENT — every policy
-- is dropped-if-exists before being (re)created — so it can be re-run safely.
--
-- BLOCKS:
--   1. subscriptions  — remove client INSERT; only the service role may insert.
--   2. profiles       — block client UPDATE of entitlement columns (trigger),
--                       while still allowing users to edit their own non-
--                       entitlement fields (e.g. full_name).
--   3. webhook_logs +
--      subscription_audit_log — restrict ALL access to the service role and
--                       REVOKE table privileges from anon/authenticated.
--   4. SECURITY DEFINER RPCs — REVOKE maintenance funcs from anon/authenticated;
--                       harden per-user funcs to only ever answer for auth.uid().
--   5. profiles SELECT — replace the always-true authenticated read with
--                       own-row-only.
--   6. subscriptions  — UNIQUE index on (payment_provider, payment_reference)
--                       to make webhook activation idempotent (kills the
--                       check-then-insert race). Verified zero existing dupes.
--
-- ROLLBACK NOTES (per block, if this ever needs reverting):
--   Block 1: recreate  CREATE POLICY "Users can insert own subscriptions"
--            ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
--            and DROP the service_role insert policy.
--   Block 2: DROP TRIGGER trg_profiles_protect_entitlements ON public.profiles;
--            DROP FUNCTION public.protect_profile_entitlements();
--   Block 3: recreate the old permissive policies
--            CREATE POLICY "Service role full access" ... FOR ALL USING (true)
--            WITH CHECK (true);  and re-GRANT to anon/authenticated if desired.
--   Block 4: re-GRANT EXECUTE ... TO anon, authenticated; restore the original
--            function bodies (see 001_initial_schema.sql for the per-user funcs).
--   Block 5: recreate  CREATE POLICY "Authenticated users can read basic profile
--            info" ON public.profiles FOR SELECT TO authenticated USING (true);
--   Block 6: DROP INDEX public.uniq_subscriptions_provider_reference;
--
-- CLIENT IMPACT (must be coordinated — see the hotfix report):
--   Blocks 1 & 2 intentionally break the CLIENT-SIDE subscription writes in
--   src/features/subscription/services/subscription-service.ts (createSubscription,
--   cancelSubscription, checkAndExpireSubscriptions) and the client activation in
--   src/app/payment/success/page.tsx. Those flows ARE the vulnerability: they let
--   a user grant themselves a plan from URL params without a verified payment.
--   The Cloudflare worker webhook (service role) is the trusted path. The success
--   page must be refactored to POLL for the worker-created subscription instead
--   of creating it. Do NOT apply this migration until that client change ships,
--   or paid activation via the client will fail (webhook activation still works).
-- =============================================================================

BEGIN;

-- Ensure RLS is on for every table we touch (idempotent).
ALTER TABLE public.subscriptions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_audit_log  ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- BLOCK 1 (#1): subscriptions — no client INSERT; service role only.
-- The service role has BYPASSRLS, so it inserts regardless; the explicit policy
-- documents intent. Dropping the client policy removes the self-grant hole.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role can insert subscriptions" ON public.subscriptions;
CREATE POLICY "Service role can insert subscriptions"
  ON public.subscriptions FOR INSERT TO service_role
  WITH CHECK (true);

-- Users keep read-only access to their own subscriptions (recreate to be sure).
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- BLOCK 2 (#3): profiles — block client UPDATE of entitlement columns.
-- RLS WITH CHECK cannot reference OLD values, so we use a BEFORE UPDATE trigger.
-- The trigger runs as the CALLING role (SECURITY INVOKER), so current_user is
-- 'authenticated'/'anon' for client calls and 'service_role' for the worker.
-- Only client roles are blocked; the worker (service_role) and admins pass.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_entitlements()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND (
        NEW.has_active_subscription IS DISTINCT FROM OLD.has_active_subscription
     OR NEW.current_plan            IS DISTINCT FROM OLD.current_plan
     OR NEW.subscription_end_date   IS DISTINCT FROM OLD.subscription_end_date
  ) THEN
    RAISE EXCEPTION 'profiles: entitlement columns (has_active_subscription, current_plan, subscription_end_date) are managed by the payment service only';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_protect_entitlements ON public.profiles;
CREATE TRIGGER trg_profiles_protect_entitlements
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_entitlements();

-- Keep the own-row UPDATE policy (users can still edit full_name, etc.).
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- BLOCK 5 (#9): profiles SELECT — own-row only.
-- LIVE had "Authenticated users can read basic profile info" USING (true), which
-- let any logged-in user read every profile (emails + entitlements). Removed.
-- Verified: no client feature reads other users' profiles (AuthContext and
-- settings both filter by the caller's own id; booking-notify uses the service
-- role and bypasses RLS).
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can read basic profile info" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- BLOCK 3 (#4): webhook_logs + subscription_audit_log — service role only.
-- LIVE policies were FOR ALL TO public USING (true) — i.e. anon/authenticated
-- could read and write logs. Restrict to service_role and REVOKE table grants.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Service role full access" ON public.webhook_logs;
DROP POLICY IF EXISTS "Service role only" ON public.webhook_logs;
CREATE POLICY "Service role only"
  ON public.webhook_logs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access" ON public.subscription_audit_log;
DROP POLICY IF EXISTS "Service role only" ON public.subscription_audit_log;
CREATE POLICY "Service role only"
  ON public.subscription_audit_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

REVOKE ALL ON public.webhook_logs           FROM anon, authenticated;
REVOKE ALL ON public.subscription_audit_log FROM anon, authenticated;

-- -----------------------------------------------------------------------------
-- BLOCK 4 (#6): SECURITY DEFINER RPCs.
-- Maintenance funcs: REVOKE from anon/authenticated (only the worker/service
-- role, and cron, should run them). The single client caller (plan-service
-- expireOldPlans) has no callers in the app, so this is safe.
-- -----------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.expire_old_plans()         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expire_old_subscriptions() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.expire_old_plans()         TO service_role;
GRANT  EXECUTE ON FUNCTION public.expire_old_subscriptions() TO service_role;

-- Per-user funcs: keep the (user_uuid uuid) signature for client type
-- compatibility, but IGNORE the argument and only ever answer for auth.uid().
-- This removes the cross-user info leak (passing an arbitrary uuid). REVOKE anon;
-- keep authenticated. Also pins search_path (SECURITY DEFINER hardening).
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = v_uid AND status = 'active' AND end_date > now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_active_subscription(user_uuid uuid)
RETURNS TABLE (
  id UUID,
  plan_type TEXT,
  end_date TIMESTAMPTZ,
  days_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN;
  END IF;
  RETURN QUERY
    SELECT s.id, s.plan_type, s.end_date,
           EXTRACT(DAY FROM (s.end_date - now()))::INTEGER AS days_remaining
    FROM public.subscriptions s
    WHERE s.user_id = v_uid AND s.status = 'active' AND s.end_date > now()
    ORDER BY s.end_date DESC
    LIMIT 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_active_subscription(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO authenticated, service_role;
GRANT  EXECUTE ON FUNCTION public.get_active_subscription(uuid) TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- BLOCK 6 (#15): idempotency guard for webhook activation.
-- Partial UNIQUE index so a payment can only ever create ONE subscription. The
-- worker relies on the resulting 23505 to treat concurrent webhooks as dupes.
-- Partial (WHERE payment_reference IS NOT NULL) so legacy null-reference rows
-- are unaffected. Verified: zero existing duplicate (provider, reference) pairs.
-- -----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uniq_subscriptions_provider_reference
  ON public.subscriptions (payment_provider, payment_reference)
  WHERE payment_reference IS NOT NULL;

COMMIT;
