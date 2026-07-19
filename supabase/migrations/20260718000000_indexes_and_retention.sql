-- =============================================================================
-- Migration: indexes_and_retention
-- Audit items: #15 (payment idempotency uniqueness), #19 (missing FK indexes),
--              webhook_logs retention.
-- =============================================================================
-- PURPOSE
--   Operational hardening for the payment / DB layer:
--     1. UNIQUE index on subscriptions(payment_provider, payment_reference) so a
--        provider payment can only ever create ONE subscription row. The
--        MercadoPago worker's webhook handler relies on this as the ON CONFLICT
--        arbiter to make payment processing idempotent.
--     2. Btree indexes on foreign-key / lookup columns that could otherwise fall
--        back to sequential scans as the tables grow.
--     3. A retention function to prune webhook_logs older than 90 days.
--
-- IDEMPOTENCY
--   Every statement uses IF NOT EXISTS / CREATE OR REPLACE, so this migration is
--   safe to run repeatedly and safe to run alongside a concurrent migration that
--   also creates the subscriptions uniqueness index (see COORDINATION below).
--
-- COORDINATION (IMPORTANT)
--   The security agent's worker change depends on the unique index
--   `uniq_subscriptions_payment_ref`. It is created here with IF NOT EXISTS so
--   double-creation from either side is a no-op. If the security migration also
--   defines it, keep BOTH — the second one becomes a no-op. Do NOT drop it from
--   either place without coordinating; the worker's idempotency breaks without it.
--
-- LIVE-STATE NOTE (inspected 2026-07-18 on project chqgylghpuzcqzkbuhsk)
--   pg_indexes shows these FK/lookup indexes ALREADY EXIST live:
--     user_plans(user_id)        -> idx_user_plans_user_id
--     subscriptions(user_id)     -> idx_subscriptions_user_id
--     webhook_logs(payment_id)   -> idx_webhook_logs_payment_id
--     bookings(user_id)          -> idx_bookings_user
--     bookings(slot_id)          -> idx_bookings_slot
--   The repo migrations are drifted, so the CREATE INDEX statements below are
--   defensive (IF NOT EXISTS) and will be no-ops against the current live DB.
--   The genuinely NEW object is the subscriptions uniqueness index.
--
-- ROLLBACK
--   DROP INDEX IF EXISTS uniq_subscriptions_payment_ref;
--   DROP INDEX IF EXISTS idx_user_plans_user_id;
--   DROP INDEX IF EXISTS idx_subscriptions_user_id;
--   DROP INDEX IF EXISTS idx_webhook_logs_payment_id;
--   DROP INDEX IF EXISTS idx_bookings_user;
--   DROP INDEX IF EXISTS idx_bookings_slot;
--   DROP FUNCTION IF EXISTS prune_webhook_logs(integer);
--   (Only drop the pre-existing FK indexes on rollback if THIS migration created
--    them; on the live DB they predate this migration, so prefer to leave them.)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Payment idempotency: one subscription per (provider, reference)
-- -----------------------------------------------------------------------------
-- NOTE on NULLs: Postgres treats each NULL as distinct in a UNIQUE index, so
-- rows with a NULL payment_reference (e.g. a subscription created before its
-- payment settles) do NOT collide. This keeps the index compatible with the
-- worker's `ON CONFLICT (payment_provider, payment_reference)` upsert.
-- Live data check (2026-07-18): 1 row, 0 NULLs, 0 duplicate groups -> safe build.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_subscriptions_payment_ref
  ON public.subscriptions (payment_provider, payment_reference);

-- -----------------------------------------------------------------------------
-- 2. Foreign-key / lookup indexes (defensive; already present live)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id
  ON public.user_plans (user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON public.subscriptions (user_id);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_payment_id
  ON public.webhook_logs (payment_id);

CREATE INDEX IF NOT EXISTS idx_bookings_user
  ON public.bookings (user_id);

CREATE INDEX IF NOT EXISTS idx_bookings_slot
  ON public.bookings (slot_id);

-- -----------------------------------------------------------------------------
-- 3. webhook_logs retention (delete rows older than N days; default 90)
-- -----------------------------------------------------------------------------
-- This function is DEFINED here but NOT wired to any scheduler. The MercadoPago
-- worker cron (owned by another agent) can call it later, e.g.:
--     SELECT prune_webhook_logs(90);
-- It returns the number of rows deleted so the caller can log it.
CREATE OR REPLACE FUNCTION public.prune_webhook_logs(retention_days integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.webhook_logs
  WHERE received_at < now() - (retention_days || ' days')::interval;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.prune_webhook_logs(integer) IS
  'Deletes webhook_logs rows older than retention_days (default 90). Returns rows deleted. Intended to be called by the worker cron; not scheduled here.';
