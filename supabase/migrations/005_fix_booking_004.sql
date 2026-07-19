-- 005_fix_booking_004.sql
-- Reconcile prod booking schema with the client + fix book_slot correctness bugs.
--
-- CONTEXT / DRIFT (confirmed against live prod chqgylghpuzcqzkbuhsk):
--   * Migration 004 was NEVER applied to prod.
--   * Prod `bookings` has NO booked_start_time / booked_end_time columns.
--   * Prod `book_slot` is ONLY the 1-arg version from 003 (p_slot_id uuid).
--   * The client (agenda multi-book flow) calls book_slot with named args
--     p_slot_id + p_start_time + p_end_time -> PostgREST returns PGRST202
--     ("function not found") because no 3-arg overload exists. Booking is broken.
--
-- This migration:
--   1. Adds the two time-window columns (idempotent).
--   2. Replaces book_slot with a single 3-arg version (defaults NULL) that
--      MATCHES the client's argument names, and drops the stale 1-arg overload
--      so PostgREST never hits an ambiguous-candidate error.
--   3. Restores the correctness guards that 004 dropped (audit finding #16):
--        - status = 'active' guard (cancelled slots must not be bookable)
--        - never return {success:true, booking_id:null}; an existing confirmed
--          booking returns an explicit error instead of a false success
--        - a previously-cancelled booking for the same (slot,user) is revived
--          via ON CONFLICT DO UPDATE so the user can rebook.
-- Idempotent: safe to run multiple times.

-- 1. Time-window columns -----------------------------------------------------
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS booked_start_time TIME,
  ADD COLUMN IF NOT EXISTS booked_end_time   TIME;

-- 2. Drop stale 1-arg overload so only the 3-arg version resolves ------------
DROP FUNCTION IF EXISTS book_slot(uuid);

-- 3. Correct 3-arg book_slot -------------------------------------------------
CREATE OR REPLACE FUNCTION book_slot(
  p_slot_id    UUID,
  p_start_time TIME DEFAULT NULL,
  p_end_time   TIME DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_slot       training_slots;
  v_booking_id UUID;
BEGIN
  SELECT * INTO v_slot
  FROM training_slots
  WHERE id = p_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Slot no encontrado');
  END IF;

  -- Guard restored: cancelled/completed slots are not bookable.
  IF v_slot.status != 'active' THEN
    RETURN json_build_object('error', 'Slot no disponible');
  END IF;

  IF v_slot.slot_date < CURRENT_DATE THEN
    RETURN json_build_object('error', 'Este horario ya paso');
  END IF;

  IF v_slot.booked_count >= v_slot.max_capacity THEN
    RETURN json_build_object('error', 'Este horario esta lleno');
  END IF;

  -- Insert a fresh booking, OR revive a previously-cancelled one for the same
  -- (slot_id, user_id). The DO UPDATE only fires when the existing row is
  -- 'cancelled'; if it is already 'confirmed' the predicate fails, no row is
  -- returned, and v_booking_id stays NULL -> we return an explicit error.
  INSERT INTO bookings (slot_id, user_id, status, booked_start_time, booked_end_time)
  VALUES (
    p_slot_id,
    auth.uid(),
    'confirmed',
    COALESCE(p_start_time, v_slot.start_time),
    COALESCE(p_end_time,   v_slot.end_time)
  )
  ON CONFLICT (slot_id, user_id) DO UPDATE
    SET status            = 'confirmed',
        booked_start_time = EXCLUDED.booked_start_time,
        booked_end_time   = EXCLUDED.booked_end_time
    WHERE bookings.status = 'cancelled'
  RETURNING id INTO v_booking_id;

  IF v_booking_id IS NOT NULL THEN
    UPDATE training_slots
    SET booked_count = booked_count + 1
    WHERE id = p_slot_id;

    RETURN json_build_object('success', true, 'booking_id', v_booking_id);
  END IF;

  -- No id returned => the user already has a confirmed booking on this slot.
  RETURN json_build_object('error', 'Ya tenes este horario reservado');
END;
$$;
