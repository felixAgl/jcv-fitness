import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CALLMEBOT_API_KEY = Deno.env.get("CALLMEBOT_API_KEY") ?? "";
const TRAINER_WHATSAPP = Deno.env.get("TRAINER_WHATSAPP") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req: Request) => {
  if (req.method === "GET") {
    return new Response(JSON.stringify({ status: "ok", service: "booking-notify" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  let payload: { type: string; table: string; record: Record<string, unknown> };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const { type, table, record } = payload;

  if (table !== "bookings" || !record) {
    return new Response(
      JSON.stringify({ status: "ignored", reason: "not a bookings event" }),
      { status: 200 }
    );
  }

  const isNewBooking = type === "INSERT" && record.status === "confirmed";
  const isCancellation = type === "UPDATE" && record.status === "cancelled";

  if (!isNewBooking && !isCancellation) {
    return new Response(
      JSON.stringify({ status: "ignored", reason: "not a relevant event" }),
      { status: 200 }
    );
  }

  if (!CALLMEBOT_API_KEY || !TRAINER_WHATSAPP) {
    console.error("[booking-notify] Missing WhatsApp config");
    return new Response(
      JSON.stringify({ status: "ignored", reason: "notification service not configured" }),
      { status: 200 }
    );
  }

  try {
    const [slotRes, clientRes] = await Promise.all([
      fetch(
        `${SUPABASE_URL}/rest/v1/training_slots?id=eq.${record.slot_id}&select=title,slot_date,start_time,end_time`,
        { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
      ),
      fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${record.user_id}&select=full_name,email`,
        { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
      ),
    ]);

    const [slots, clients] = await Promise.all([slotRes.json(), clientRes.json()]);
    const slot = slots[0] as { title: string; slot_date: string; start_time: string; end_time: string } | undefined;
    const client = clients[0] as { full_name: string | null; email: string } | undefined;

    if (!slot) {
      console.error(`[booking-notify] Slot not found: ${record.slot_id}`);
      return new Response(JSON.stringify({ status: "error", reason: "slot not found" }), { status: 200 });
    }

    const name = client?.full_name?.trim() || null;
    const email = client?.email || null;
    const clientLabel = name && email
      ? `${name} (${email})`
      : name || email || "Un cliente";

    const dateStr = formatSlotDate(slot.slot_date);
    // Use booked_start_time when available (user selected a 1-hour window within a long slot)
    const effectiveStart = (record.booked_start_time as string | null) ?? slot.start_time;
    const timeStr = formatSlotTime(effectiveStart);

    const message = isNewBooking
      ? `*Nueva reserva!*\n${clientLabel} reservo *${slot.title}* para el ${dateStr} a las ${timeStr}.`
      : `*Cancelacion!*\n${clientLabel} cancelo su reserva de *${slot.title}* del ${dateStr} a las ${timeStr}.`;

    await sendWhatsApp(message);

    console.log(`[booking-notify] Sent ${isNewBooking ? "booking" : "cancellation"} for slot ${record.slot_id}`);
    return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
  } catch (err) {
    const error = err as Error;
    console.error("[booking-notify] Error:", error.message);
    return new Response(JSON.stringify({ status: "error", reason: error.message }), { status: 500 });
  }
});

function formatSlotDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

function formatSlotTime(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const display = h % 12 || 12;
  return `${display}:${String(m).padStart(2, "0")} ${ampm}`;
}

async function sendWhatsApp(message: string): Promise<void> {
  const url = `https://api.callmebot.com/whatsapp.php?phone=${TRAINER_WHATSAPP}&text=${encodeURIComponent(message)}&apikey=${CALLMEBOT_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CallMeBot ${res.status}: ${text}`);
  }
}
