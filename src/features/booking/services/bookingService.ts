import { createClient } from "@/lib/supabase/client";
import type {
  TrainingSlot,
  Booking,
  BookingWithSlot,
  UserTimePreferences,
  CreateSlotInput,
  SlotWithBookings,
} from "../types";

function getClient() {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase client not available");
  return supabase;
}

export const bookingService = {
  async getAvailableSlots(fromDate: string, toDate: string, userId: string | null): Promise<TrainingSlot[]> {
    const supabase = getClient();

    const { data: slots, error } = await supabase
      .from("training_slots")
      .select("*")
      .eq("status", "active")
      .gte("slot_date", fromDate)
      .lte("slot_date", toDate)
      .order("slot_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) throw new Error(error.message);
    if (!slots) return [];

    if (!userId) {
      return slots.map((slot) => ({ ...slot, is_booked_by_user: false }));
    }

    const { data: userBookings } = await supabase
      .from("bookings")
      .select("slot_id")
      .eq("user_id", userId)
      .eq("status", "confirmed");

    const bookedSlotIds = new Set((userBookings ?? []).map((b) => b.slot_id));

    return slots.map((slot) => ({
      ...slot,
      is_booked_by_user: bookedSlotIds.has(slot.id),
    }));
  },

  async bookSlot(
    slotId: string,
    startTime?: string,
    endTime?: string,
  ): Promise<{ success: boolean; booking_id?: string; error?: string }> {
    const supabase = getClient();
    const params: Record<string, string> = { p_slot_id: slotId };
    if (startTime) params.p_start_time = startTime;
    if (endTime) params.p_end_time = endTime;
    const { data, error } = await supabase.rpc("book_slot", params);
    if (error) return { success: false, error: error.message };
    return data as { success: boolean; booking_id?: string; error?: string };
  },

  async cancelBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = getClient();
    const { data, error } = await supabase.rpc("cancel_booking", { p_booking_id: bookingId });
    if (error) return { success: false, error: error.message };
    return data as { success: boolean; error?: string };
  },

  async getUserBookings(userId: string): Promise<BookingWithSlot[]> {
    const supabase = getClient();
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        slot:training_slots(*)
      `)
      .eq("user_id", userId)
      .eq("status", "confirmed")
      .gte("slot.slot_date", today)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? [])
      .filter((b) => b.slot !== null)
      .map((b) => ({ ...b, slot: b.slot as TrainingSlot })) as BookingWithSlot[];
  },

  async getUserPreferences(userId: string): Promise<UserTimePreferences | null> {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("user_time_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw new Error(error.message);
    if (!data) return null;

    return {
      preferred_days: data.preferred_days ?? [],
      preferred_time_start: data.preferred_time_start ?? "07:00",
      preferred_time_end: data.preferred_time_end ?? "20:00",
    };
  },

  async saveUserPreferences(userId: string, prefs: UserTimePreferences): Promise<void> {
    const supabase = getClient();
    const { error } = await supabase
      .from("user_time_preferences")
      .upsert({
        user_id: userId,
        preferred_days: prefs.preferred_days,
        preferred_time_start: prefs.preferred_time_start,
        preferred_time_end: prefs.preferred_time_end,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (error) throw new Error(error.message);
  },

  async createSlot(trainerId: string, input: CreateSlotInput): Promise<TrainingSlot> {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("training_slots")
      .insert({ ...input, trainer_id: trainerId })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as TrainingSlot;
  },

  async createSlots(trainerId: string, inputs: CreateSlotInput[]): Promise<void> {
    if (inputs.length === 0) return;
    const supabase = getClient();
    const { error } = await supabase
      .from("training_slots")
      .insert(inputs.map((input) => ({ ...input, trainer_id: trainerId })));

    if (error) throw new Error(error.message);
  },

  async bookSlots(
    slots: Array<{ id: string; start_time?: string; end_time?: string }>,
  ): Promise<{ booked: string[]; errors: string[] }> {
    const results = await Promise.all(
      slots.map((s) => this.bookSlot(s.id, s.start_time, s.end_time)),
    );
    const booked: string[] = [];
    const errors: string[] = [];

    results.forEach((result, idx) => {
      if (result.success) {
        booked.push(slots[idx].id);
      } else {
        errors.push(result.error ?? `Error al reservar slot ${slots[idx].id}`);
      }
    });

    return { booked, errors };
  },

  async updateSlot(slotId: string, updates: Partial<CreateSlotInput>): Promise<void> {
    const supabase = getClient();
    const { error } = await supabase
      .from("training_slots")
      .update(updates)
      .eq("id", slotId);

    if (error) throw new Error(error.message);
  },

  async cancelSlot(slotId: string): Promise<void> {
    const supabase = getClient();
    const { error } = await supabase
      .from("training_slots")
      .update({ status: "cancelled" })
      .eq("id", slotId);

    if (error) throw new Error(error.message);
  },

  async getTrainerSlots(trainerId: string, fromDate: string, toDate: string): Promise<SlotWithBookings[]> {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("training_slots")
      .select(`
        *,
        bookings(
          id,
          user_id,
          status,
          created_at,
          profile:profiles(full_name, email)
        )
      `)
      .eq("trainer_id", trainerId)
      .gte("slot_date", fromDate)
      .lte("slot_date", toDate)
      .order("slot_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as SlotWithBookings[];
  },
};
