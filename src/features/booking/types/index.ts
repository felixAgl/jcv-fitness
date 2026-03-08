export interface TrainingSlot {
  id: string;
  trainer_id: string;
  title: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  booked_count: number;
  status: "active" | "cancelled" | "completed";
  notes?: string;
  created_at: string;
  is_booked_by_user?: boolean;
}

export interface Booking {
  id: string;
  slot_id: string;
  user_id: string;
  status: "confirmed" | "cancelled";
  created_at: string;
  slot?: TrainingSlot;
}

export interface UserTimePreferences {
  preferred_days: number[];
  preferred_time_start: string;
  preferred_time_end: string;
}

export interface CreateSlotInput {
  title: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  notes?: string;
}

export interface RecurringSlotInput {
  title: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  notes?: string;
  repeat: "once" | "daily" | "weekly";
  days_of_week: number[]; // 0=Sun, 1=Mon, ..., 6=Sat (only for "weekly")
}

export interface BookingWithSlot extends Booking {
  slot: TrainingSlot;
}

export interface SlotWithBookings extends TrainingSlot {
  bookings?: Array<{
    id: string;
    user_id: string;
    status: string;
    created_at: string;
    profile?: {
      full_name: string | null;
      email: string;
    };
  }>;
}
