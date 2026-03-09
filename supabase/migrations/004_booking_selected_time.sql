-- Add selected time window to bookings table
-- When a trainer creates a long/all-day slot, the client picks a 1-hour window.
-- These fields store WHICH hour the client selected, not just the slot's full range.
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS booked_start_time TIME,
  ADD COLUMN IF NOT EXISTS booked_end_time TIME;

-- Update book_slot RPC to accept optional time parameters.
-- When p_start_time/p_end_time are NULL, defaults to the full slot times.
CREATE OR REPLACE FUNCTION book_slot(
  p_slot_id UUID,
  p_start_time TIME DEFAULT NULL,
  p_end_time TIME DEFAULT NULL
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_slot training_slots;
  v_booking_id UUID;
BEGIN
  SELECT * INTO v_slot FROM training_slots WHERE id = p_slot_id FOR UPDATE;
  IF NOT FOUND THEN RETURN json_build_object('error', 'Slot not found'); END IF;
  IF v_slot.booked_count >= v_slot.max_capacity THEN RETURN json_build_object('error', 'Slot lleno'); END IF;
  IF v_slot.slot_date < CURRENT_DATE THEN RETURN json_build_object('error', 'El horario ya paso'); END IF;

  INSERT INTO bookings (slot_id, user_id, booked_start_time, booked_end_time)
  VALUES (
    p_slot_id,
    auth.uid(),
    COALESCE(p_start_time, v_slot.start_time),
    COALESCE(p_end_time, v_slot.end_time)
  )
  ON CONFLICT (slot_id, user_id) DO NOTHING
  RETURNING id INTO v_booking_id;

  IF v_booking_id IS NOT NULL THEN
    UPDATE training_slots SET booked_count = booked_count + 1 WHERE id = p_slot_id;
  END IF;

  RETURN json_build_object('success', true, 'booking_id', v_booking_id);
END;
$$;
