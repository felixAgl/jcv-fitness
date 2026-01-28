-- JCV Fitness Subscription System
-- Initial Schema Migration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/chqgylghpuzcqzkbuhsk/sql/new

-- ============================================
-- PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  has_active_subscription BOOLEAN DEFAULT FALSE,
  current_plan TEXT CHECK (current_plan IS NULL OR current_plan IN ('PLAN_BASICO', 'PLAN_PRO', 'PLAN_PREMIUM')),
  subscription_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('PLAN_BASICO', 'PLAN_PRO', 'PLAN_PREMIUM')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  payment_provider TEXT CHECK (payment_provider IN ('mercadopago', 'wompi')),
  payment_reference TEXT,
  amount_paid INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON public.subscriptions(end_date);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- WIZARD_DATA TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.wizard_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wizard_data_user_id ON public.wizard_data(user_id);

-- Enable RLS
ALTER TABLE public.wizard_data ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own wizard data"
  ON public.wizard_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wizard data"
  ON public.wizard_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wizard data"
  ON public.wizard_data FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- PLAN_DOWNLOADS TABLE (for tracking/security)
-- ============================================
CREATE TABLE IF NOT EXISTS public.plan_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  download_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_plan_downloads_user_id ON public.plan_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_downloads_subscription_id ON public.plan_downloads(subscription_id);
CREATE INDEX IF NOT EXISTS idx_plan_downloads_token ON public.plan_downloads(download_token);

-- Enable RLS
ALTER TABLE public.plan_downloads ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own downloads"
  ON public.plan_downloads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own downloads"
  ON public.plan_downloads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
    AND status = 'active'
    AND end_date > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active subscription
CREATE OR REPLACE FUNCTION public.get_active_subscription(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  plan_type TEXT,
  end_date TIMESTAMPTZ,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.plan_type,
    s.end_date,
    EXTRACT(DAY FROM (s.end_date - NOW()))::INTEGER as days_remaining
  FROM public.subscriptions s
  WHERE s.user_id = user_uuid
  AND s.status = 'active'
  AND s.end_date > NOW()
  ORDER BY s.end_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old subscriptions (to be called by cron)
CREATE OR REPLACE FUNCTION public.expire_old_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE public.subscriptions
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active' AND end_date < NOW();

  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  -- Update profiles
  UPDATE public.profiles p
  SET
    has_active_subscription = FALSE,
    current_plan = NULL,
    subscription_end_date = NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = p.id
    AND s.status = 'active'
    AND s.end_date > NOW()
  )
  AND p.has_active_subscription = TRUE;

  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_wizard_data_updated_at ON public.wizard_data;
CREATE TRIGGER update_wizard_data_updated_at
  BEFORE UPDATE ON public.wizard_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
