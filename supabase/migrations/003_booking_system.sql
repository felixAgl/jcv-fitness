-- Add trainer flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_trainer BOOLEAN DEFAULT FALSE;

-- Training slots created by the trainer
CREATE TABLE IF NOT EXISTS training_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_capacity INT NOT NULL DEFAULT 1,
  booked_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Client bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES training_slots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(slot_id, user_id)
);

-- Client preferred hours for smart slot matching
CREATE TABLE IF NOT EXISTS user_time_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  preferred_days INT[] NOT NULL DEFAULT '{}',
  preferred_time_start TIME NOT NULL DEFAULT '07:00',
  preferred_time_end TIME NOT NULL DEFAULT '20:00',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_slots_trainer_date ON training_slots(trainer_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_training_slots_date_status ON training_slots(slot_date, status);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_slot ON bookings(slot_id);

-- RLS
ALTER TABLE training_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_time_preferences ENABLE ROW LEVEL SECURITY;

-- training_slots policies
CREATE POLICY "slots_read_active" ON training_slots
  FOR SELECT TO authenticated
  USING (status = 'active');

CREATE POLICY "slots_trainer_all" ON training_slots
  FOR ALL TO authenticated
  USING (trainer_id = auth.uid());

-- bookings policies
CREATE POLICY "bookings_own_read" ON bookings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "bookings_insert" ON bookings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "bookings_own_update" ON bookings
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "bookings_trainer_read" ON bookings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_slots
      WHERE training_slots.id = bookings.slot_id
        AND training_slots.trainer_id = auth.uid()
    )
  );

-- user_time_preferences policies
CREATE POLICY "prefs_own" ON user_time_preferences
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RPC: book a slot atomically (prevents overbooking)
CREATE OR REPLACE FUNCTION book_slot(p_slot_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_slot training_slots;
  v_booking_id UUID;
BEGIN
  SELECT * INTO v_slot
  FROM training_slots
  WHERE id = p_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Slot no encontrado');
  END IF;

  IF v_slot.status != 'active' THEN
    RETURN json_build_object('error', 'Slot no disponible');
  END IF;

  IF v_slot.slot_date < CURRENT_DATE THEN
    RETURN json_build_object('error', 'Este horario ya paso');
  END IF;

  IF v_slot.booked_count >= v_slot.max_capacity THEN
    RETURN json_build_object('error', 'Este horario esta lleno');
  END IF;

  INSERT INTO bookings (slot_id, user_id)
  VALUES (p_slot_id, auth.uid())
  ON CONFLICT (slot_id, user_id) DO NOTHING
  RETURNING id INTO v_booking_id;

  IF v_booking_id IS NOT NULL THEN
    UPDATE training_slots
    SET booked_count = booked_count + 1
    WHERE id = p_slot_id;

    RETURN json_build_object('success', true, 'booking_id', v_booking_id);
  ELSE
    RETURN json_build_object('error', 'Ya tenes este horario reservado');
  END IF;
END;
$$;

-- RPC: cancel a booking atomically
CREATE OR REPLACE FUNCTION cancel_booking(p_booking_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_slot_id UUID;
BEGIN
  UPDATE bookings
  SET status = 'cancelled'
  WHERE id = p_booking_id
    AND user_id = auth.uid()
    AND status = 'confirmed'
  RETURNING slot_id INTO v_slot_id;

  IF v_slot_id IS NOT NULL THEN
    UPDATE training_slots
    SET booked_count = GREATEST(booked_count - 1, 0)
    WHERE id = v_slot_id;

    RETURN json_build_object('success', true);
  END IF;

  RETURN json_build_object('error', 'Reserva no encontrada');
END;
$$;
