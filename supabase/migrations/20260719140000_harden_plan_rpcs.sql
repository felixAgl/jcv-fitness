-- =============================================================================
-- SECURITY FOLLOW-UP — HARDEN PLAN RPCs (IDOR)
-- =============================================================================
-- Migration: 20260719140000_harden_plan_rpcs
--
-- WHY: can_create_plan / create_user_plan / get_active_plan are SECURITY DEFINER
-- and were anon/authenticated-executable while taking a caller-supplied
-- `user_uuid`. A signed-in (or anon) user could pass ANY user id to create,
-- overwrite, or read another user's plan (IDOR). register_plan_download already
-- guards on auth.uid(), so it only needs the anon EXECUTE revoked.
--
-- APPROACH (minimal, behavior-preserving): add a single authorization guard at
-- the top of each function — `IF user_uuid IS DISTINCT FROM auth.uid() ...`.
-- The client always passes its OWN id (== auth.uid()), so legitimate calls run
-- exactly as before; only cross-user calls are blocked. The rest of each body
-- is copied verbatim from the live definition.
--
-- ROLLBACK: restore the bodies without the guard (see 001_initial_schema.sql /
-- the pre-migration live definitions) and re-GRANT EXECUTE ... TO anon.
-- =============================================================================

BEGIN;

-- can_create_plan --------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_create_plan(user_uuid uuid)
RETURNS TABLE(can_create boolean, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  has_subscription BOOLEAN;
  has_active_plan BOOLEAN;
  has_used_free BOOLEAN;
BEGIN
  -- Authorization guard: only answer for the caller's own account.
  IF user_uuid IS DISTINCT FROM auth.uid() THEN
    RETURN QUERY SELECT FALSE, 'not_authorized'::TEXT;
    RETURN;
  END IF;

  SELECT public.has_active_subscription(user_uuid) INTO has_subscription;

  SELECT EXISTS (
    SELECT 1 FROM public.user_plans
    WHERE user_id = user_uuid AND is_active = TRUE
  ) INTO has_active_plan;

  SELECT COALESCE(p.has_free_plan_used, FALSE) INTO has_used_free
  FROM public.profiles p
  WHERE p.id = user_uuid;

  IF has_subscription THEN
    RETURN QUERY SELECT TRUE, NULL::TEXT;
    RETURN;
  END IF;

  IF has_active_plan THEN
    RETURN QUERY SELECT FALSE, 'already_has_plan'::TEXT;
    RETURN;
  END IF;

  IF has_used_free THEN
    RETURN QUERY SELECT FALSE, 'free_used'::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$function$;

-- create_user_plan -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_user_plan(user_uuid uuid, p_plan_data jsonb, p_plan_type text DEFAULT 'free'::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_plan_id UUID;
  plan_duration INTERVAL;
BEGIN
  -- Authorization guard: a user may only create a plan for themselves.
  IF user_uuid IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not_authorized: cannot create a plan for another user';
  END IF;

  UPDATE public.user_plans
  SET is_active = FALSE, updated_at = NOW()
  WHERE user_id = user_uuid AND is_active = TRUE;

  IF p_plan_type = 'free' THEN
    plan_duration := INTERVAL '5 weeks';
  ELSE
    plan_duration := INTERVAL '1 year';
  END IF;

  INSERT INTO public.user_plans (user_id, plan_data, plan_type, expires_at)
  VALUES (user_uuid, p_plan_data, p_plan_type, NOW() + plan_duration)
  RETURNING id INTO new_plan_id;

  UPDATE public.profiles
  SET
    has_free_plan_used = CASE WHEN p_plan_type = 'free' THEN TRUE ELSE has_free_plan_used END,
    free_plan_expires_at = CASE WHEN p_plan_type = 'free' THEN NOW() + plan_duration ELSE free_plan_expires_at END,
    active_plan_id = new_plan_id,
    updated_at = NOW()
  WHERE id = user_uuid;

  RETURN new_plan_id;
END;
$function$;

-- get_active_plan --------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_active_plan(user_uuid uuid)
RETURNS TABLE(id uuid, plan_data jsonb, plan_type text, created_at timestamp with time zone, expires_at timestamp with time zone, is_expired boolean, days_remaining integer, download_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Authorization guard: only return the caller's own plan.
  IF user_uuid IS DISTINCT FROM auth.uid() THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    up.id,
    up.plan_data,
    up.plan_type,
    up.created_at,
    up.expires_at,
    (up.expires_at < NOW()) as is_expired,
    GREATEST(0, EXTRACT(DAY FROM (up.expires_at - NOW()))::INTEGER) as days_remaining,
    up.download_count
  FROM public.user_plans up
  WHERE up.user_id = user_uuid
  AND up.is_active = TRUE
  ORDER BY up.created_at DESC
  LIMIT 1;
END;
$function$;

-- Lock down EXECUTE: revoke anon everywhere; keep authenticated + service_role.
-- register_plan_download already guards on auth.uid() internally; just revoke anon.
REVOKE EXECUTE ON FUNCTION public.can_create_plan(uuid)                         FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_user_plan(uuid, jsonb, text)          FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_active_plan(uuid)                        FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.register_plan_download(uuid)                 FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.can_create_plan(uuid)                          TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_user_plan(uuid, jsonb, text)           TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_active_plan(uuid)                         TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.register_plan_download(uuid)                  TO authenticated, service_role;

COMMIT;
