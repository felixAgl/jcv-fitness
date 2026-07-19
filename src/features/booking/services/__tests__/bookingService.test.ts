import { describe, it, expect, vi, beforeEach } from "vitest";
import { bookingService } from "../bookingService";

// Mock the Supabase client factory. The booking RPCs (book_slot / cancel_booking)
// are executed server-side in Postgres (see migrations/005_fix_booking_004.sql).
// These tests verify the CLIENT SERVICE CONTRACT: that bookingService forwards
// the exact args the fixed SQL function expects, and correctly surfaces the
// success / error envelopes that the corrected book_slot returns — in
// particular that a rejected booking never leaks through as a false success.
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/client";

function makeClient() {
  const rpc = vi.fn();
  return { rpc };
}

describe("bookingService.bookSlot", () => {
  let client: ReturnType<typeof makeClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = makeClient();
    vi.mocked(createClient).mockReturnValue(client as never);
  });

  it("sends the 3-arg RPC (p_slot_id + p_start_time + p_end_time) when a window is given", async () => {
    client.rpc.mockResolvedValue({
      data: { success: true, booking_id: "book-1" },
      error: null,
    });

    const result = await bookingService.bookSlot("slot-1", "07:00", "08:00");

    expect(client.rpc).toHaveBeenCalledWith("book_slot", {
      p_slot_id: "slot-1",
      p_start_time: "07:00",
      p_end_time: "08:00",
    });
    expect(result).toEqual({ success: true, booking_id: "book-1" });
  });

  it("omits time params when no window is given (1-arg call still resolves via defaults)", async () => {
    client.rpc.mockResolvedValue({
      data: { success: true, booking_id: "book-2" },
      error: null,
    });

    await bookingService.bookSlot("slot-1");

    expect(client.rpc).toHaveBeenCalledWith("book_slot", { p_slot_id: "slot-1" });
  });

  it("returns success on a fresh booking", async () => {
    client.rpc.mockResolvedValue({
      data: { success: true, booking_id: "book-3" },
      error: null,
    });

    const result = await bookingService.bookSlot("slot-1", "07:00", "08:00");

    expect(result.success).toBe(true);
    expect(result.booking_id).toBe("book-3");
  });

  it("rejects a double-book as an ERROR, not a false success (audit #16)", async () => {
    // Corrected book_slot returns an explicit error instead of
    // {success:true, booking_id:null} when the user already holds the slot.
    client.rpc.mockResolvedValue({
      data: { error: "Ya tenes este horario reservado" },
      error: null,
    });

    const result = await bookingService.bookSlot("slot-1", "07:00", "08:00");

    expect(result.success).not.toBe(true);
    expect(result.booking_id).toBeUndefined();
    expect(result.error).toBe("Ya tenes este horario reservado");
  });

  it("rejects booking a cancelled slot", async () => {
    // status='active' guard restored in 005 -> cancelled slots are not bookable.
    client.rpc.mockResolvedValue({
      data: { error: "Slot no disponible" },
      error: null,
    });

    const result = await bookingService.bookSlot("slot-cancelled");

    expect(result.success).not.toBe(true);
    expect(result.error).toBe("Slot no disponible");
  });

  it("lets a previously-cancelled user rebook (revived row -> success)", async () => {
    // ON CONFLICT DO UPDATE revives the cancelled row and returns its id.
    client.rpc.mockResolvedValue({
      data: { success: true, booking_id: "book-revived" },
      error: null,
    });

    const result = await bookingService.bookSlot("slot-1", "09:00", "10:00");

    expect(result.success).toBe(true);
    expect(result.booking_id).toBe("book-revived");
  });

  it("surfaces a transport error (e.g. PGRST202) as a failed result", async () => {
    client.rpc.mockResolvedValue({
      data: null,
      error: { message: "Could not find the function public.book_slot" },
    });

    const result = await bookingService.bookSlot("slot-1", "07:00", "08:00");

    expect(result.success).toBe(false);
    expect(result.error).toContain("book_slot");
  });
});

describe("bookingService.bookSlots (multi-book)", () => {
  let client: ReturnType<typeof makeClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = makeClient();
    vi.mocked(createClient).mockReturnValue(client as never);
  });

  it("partitions results into booked ids and error messages", async () => {
    client.rpc
      .mockResolvedValueOnce({ data: { success: true, booking_id: "b1" }, error: null })
      .mockResolvedValueOnce({ data: { error: "Este horario esta lleno" }, error: null });

    const { booked, errors } = await bookingService.bookSlots([
      { id: "slot-1", start_time: "07:00", end_time: "08:00" },
      { id: "slot-2", start_time: "08:00", end_time: "09:00" },
    ]);

    expect(booked).toEqual(["slot-1"]);
    expect(errors).toEqual(["Este horario esta lleno"]);
  });

  it("does NOT count a double-booked slot as booked (no false success)", async () => {
    client.rpc.mockResolvedValue({
      data: { error: "Ya tenes este horario reservado" },
      error: null,
    });

    const { booked, errors } = await bookingService.bookSlots([
      { id: "slot-1", start_time: "07:00", end_time: "08:00" },
    ]);

    expect(booked).toEqual([]);
    expect(errors).toHaveLength(1);
  });
});

describe("bookingService.cancelBooking", () => {
  let client: ReturnType<typeof makeClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = makeClient();
    vi.mocked(createClient).mockReturnValue(client as never);
  });

  it("forwards the booking id to the cancel_booking RPC", async () => {
    client.rpc.mockResolvedValue({ data: { success: true }, error: null });

    const result = await bookingService.cancelBooking("book-1");

    expect(client.rpc).toHaveBeenCalledWith("cancel_booking", { p_booking_id: "book-1" });
    expect(result).toEqual({ success: true });
  });

  it("surfaces a transport error as a failed result", async () => {
    client.rpc.mockResolvedValue({ data: null, error: { message: "boom" } });

    const result = await bookingService.cancelBooking("book-1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("boom");
  });
});
