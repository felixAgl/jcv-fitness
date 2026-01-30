-- JCV Fitness Freemium System
-- Migration: user_plans table + profiles updates
-- Run this in Supabase SQL Editor after 001_initial_schema.sql

-- ============================================
-- USER_PLANS TABLE (Freemium plan storage)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_data JSONB NOT NULL,           -- WizardState serializado
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'paid')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,    -- created_at + 5 weeks para free
  is_active BOOLEAN DEFAULT TRUE,
  download_count INTEGER DEFAULT 0,   -- Solo paid puede incrementar
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Partial unique index: solo 1 plan activo por usuario
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_plans_active_user
  ON public.user_plans(user_id)
  WHERE is_active = TRUE;

-- Regular indexes
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON public.user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_expires_at ON public.user_plans(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_plans_is_active ON public.user_plans(is_active);

-- Enable RLS
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own plans"
  ON public.user_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans"
  ON public.user_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans"
  ON public.user_plans FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- UPDATE PROFILES TABLE
-- ============================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_free_plan_used BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS free_plan_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS active_plan_id UUID REFERENCES public.user_plans(id);

-- ============================================
-- FUNCTIONS FOR FREEMIUM SYSTEM
-- ============================================

-- Function to check if user can create a new plan
CREATE OR REPLACE FUNCTION public.can_create_plan(user_uuid UUID)
RETURNS TABLE (
  can_create BOOLEAN,
  reason TEXT
) AS $$
DECLARE
  has_subscription BOOLEAN;
  has_active_plan BOOLEAN;
  has_used_free BOOLEAN;
BEGIN
  -- Check if user has active subscription
  SELECT public.has_active_subscription(user_uuid) INTO has_subscription;

  -- Check if user has an active plan
  SELECT EXISTS (
    SELECT 1 FROM public.user_plans
    WHERE user_id = user_uuid AND is_active = TRUE
  ) INTO has_active_plan;

  -- Check if user has already used their free plan
  SELECT COALESCE(p.has_free_plan_used, FALSE) INTO has_used_free
  FROM public.profiles p
  WHERE p.id = user_uuid;

  -- Paid users can always create
  IF has_subscription THEN
    RETURN QUERY SELECT TRUE, NULL::TEXT;
    RETURN;
  END IF;

  -- Check for active plan
  IF has_active_plan THEN
    RETURN QUERY SELECT FALSE, 'already_has_plan'::TEXT;
    RETURN;
  END IF;

  -- Check if free plan already used
  IF has_used_free THEN
    RETURN QUERY SELECT FALSE, 'free_used'::TEXT;
    RETURN;
  END IF;

  -- User can create free plan
  RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active plan for user
CREATE OR REPLACE FUNCTION public.get_active_plan(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  plan_data JSONB,
  plan_type TEXT,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_expired BOOLEAN,
  days_remaining INTEGER,
  download_count INTEGER
) AS $$
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new plan
CREATE OR REPLACE FUNCTION public.create_user_plan(
  user_uuid UUID,
  p_plan_data JSONB,
  p_plan_type TEXT DEFAULT 'free'
)
RETURNS UUID AS $$
DECLARE
  new_plan_id UUID;
  plan_duration INTERVAL;
BEGIN
  -- Deactivate any existing active plans
  UPDATE public.user_plans
  SET is_active = FALSE, updated_at = NOW()
  WHERE user_id = user_uuid AND is_active = TRUE;

  -- Set duration based on plan type (free = 5 weeks, paid = 1 year)
  IF p_plan_type = 'free' THEN
    plan_duration := INTERVAL '5 weeks';
  ELSE
    plan_duration := INTERVAL '1 year';
  END IF;

  -- Create new plan
  INSERT INTO public.user_plans (user_id, plan_data, plan_type, expires_at)
  VALUES (user_uuid, p_plan_data, p_plan_type, NOW() + plan_duration)
  RETURNING id INTO new_plan_id;

  -- Update profile
  UPDATE public.profiles
  SET
    has_free_plan_used = CASE WHEN p_plan_type = 'free' THEN TRUE ELSE has_free_plan_used END,
    free_plan_expires_at = CASE WHEN p_plan_type = 'free' THEN NOW() + plan_duration ELSE free_plan_expires_at END,
    active_plan_id = new_plan_id,
    updated_at = NOW()
  WHERE id = user_uuid;

  RETURN new_plan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old plans (to be called by cron or on access)
CREATE OR REPLACE FUNCTION public.expire_old_plans()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE public.user_plans
  SET is_active = FALSE, updated_at = NOW()
  WHERE is_active = TRUE AND expires_at < NOW();

  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  -- Clear active_plan_id from profiles where plan expired
  UPDATE public.profiles p
  SET active_plan_id = NULL, updated_at = NOW()
  WHERE p.active_plan_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_plans up
    WHERE up.id = p.active_plan_id
    AND up.is_active = TRUE
    AND up.expires_at > NOW()
  );

  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to register download (only for paid plans)
CREATE OR REPLACE FUNCTION public.register_plan_download(plan_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  plan_owner UUID;
  has_sub BOOLEAN;
BEGIN
  -- Get plan owner
  SELECT user_id INTO plan_owner
  FROM public.user_plans
  WHERE id = plan_uuid;

  -- Check if caller owns the plan
  IF plan_owner != auth.uid() THEN
    RETURN FALSE;
  END IF;

  -- Check if user has active subscription
  SELECT public.has_active_subscription(plan_owner) INTO has_sub;

  IF NOT has_sub THEN
    RETURN FALSE;
  END IF;

  -- Increment download count
  UPDATE public.user_plans
  SET download_count = download_count + 1, updated_at = NOW()
  WHERE id = plan_uuid;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
DROP TRIGGER IF EXISTS update_user_plans_updated_at ON public.user_plans;
CREATE TRIGGER update_user_plans_updated_at
  BEFORE UPDATE ON public.user_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
