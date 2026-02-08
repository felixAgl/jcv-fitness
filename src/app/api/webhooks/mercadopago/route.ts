import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase admin client for webhook operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { persistSession: false } }
);

// Plan configuration
const PLAN_CONFIG: Record<number, { type: string; days: number }> = {
  49900: { type: "PLAN_BASICO", days: 40 },
  89900: { type: "PLAN_PRO", days: 40 },
  149900: { type: "PLAN_PREMIUM", days: 40 },
};

interface MercadoPagoPayment {
  id: number;
  status: string;
  status_detail: string;
  external_reference: string;
  transaction_amount: number;
  payer: {
    email: string;
    id: string;
  };
  metadata?: {
    user_id?: string;
    plan_type?: string;
  };
}

/**
 * Webhook endpoint for MercadoPago payment notifications
 *
 * MercadoPago sends notifications when payment status changes:
 * - payment.created
 * - payment.updated (status: approved, pending, rejected, etc.)
 *
 * Docs: https://www.mercadopago.com.co/developers/en/docs/your-integrations/notifications/webhooks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("[Webhook MP] Received:", JSON.stringify(body, null, 2));

    // MercadoPago sends different types of notifications
    const { type, data, action } = body;

    // We only care about payment notifications
    if (type !== "payment" && action !== "payment.updated" && action !== "payment.created") {
      console.log("[Webhook MP] Ignoring non-payment notification:", type, action);
      return NextResponse.json({ received: true });
    }

    const paymentId = data?.id;
    if (!paymentId) {
      console.error("[Webhook MP] No payment ID in notification");
      return NextResponse.json({ error: "No payment ID" }, { status: 400 });
    }

    // Fetch payment details from MercadoPago API
    const payment = await fetchPaymentDetails(paymentId);
    if (!payment) {
      console.error("[Webhook MP] Could not fetch payment details");
      return NextResponse.json({ error: "Could not fetch payment" }, { status: 500 });
    }

    console.log("[Webhook MP] Payment details:", {
      id: payment.id,
      status: payment.status,
      amount: payment.transaction_amount,
      external_reference: payment.external_reference,
      payer_email: payment.payer?.email,
    });

    // Only process approved payments
    if (payment.status !== "approved") {
      console.log("[Webhook MP] Payment not approved, status:", payment.status);
      return NextResponse.json({
        received: true,
        status: payment.status,
        message: "Payment not approved yet"
      });
    }

    // Activate subscription
    const result = await activateSubscription(payment);

    return NextResponse.json({
      received: true,
      processed: true,
      subscription: result
    });

  } catch (error) {
    console.error("[Webhook MP] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Fetch payment details from MercadoPago API
 */
async function fetchPaymentDetails(paymentId: string | number): Promise<MercadoPagoPayment | null> {
  const accessToken = process.env.MP_ACCESS_TOKEN;

  if (!accessToken) {
    console.error("[Webhook MP] MP_ACCESS_TOKEN not configured");
    return null;
  }

  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error("[Webhook MP] MercadoPago API error:", response.status);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("[Webhook MP] Error fetching payment:", error);
    return null;
  }
}

/**
 * Activate subscription for a user based on approved payment
 */
async function activateSubscription(payment: MercadoPagoPayment) {
  // Get user from external_reference or payer email
  // external_reference format: "jcv-{timestamp}-{userId}" or just "jcv-{timestamp}"
  const externalRef = payment.external_reference || "";
  const payerEmail = payment.payer?.email;
  const userId = payment.metadata?.user_id;

  // Try to extract user_id from external_reference if it contains it
  let userIdFromRef: string | null = null;
  const refParts = externalRef.split("-");
  if (refParts.length >= 3) {
    userIdFromRef = refParts.slice(2).join("-"); // In case UUID has dashes
  }

  // Find user by: 1) metadata user_id, 2) external_reference user_id, 3) payer email
  let user = null;

  if (userId) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("id", userId)
      .single();
    user = data;
  }

  if (!user && userIdFromRef) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("id", userIdFromRef)
      .single();
    user = data;
  }

  if (!user && payerEmail) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("email", payerEmail)
      .single();
    user = data;
  }

  if (!user) {
    console.error("[Webhook MP] Could not find user for payment:", {
      external_reference: externalRef,
      payer_email: payerEmail,
      metadata_user_id: userId,
    });
    throw new Error("User not found");
  }

  console.log("[Webhook MP] Found user:", user.email);

  // Determine plan type from amount
  const amount = payment.transaction_amount;
  const planConfig = PLAN_CONFIG[amount];

  if (!planConfig) {
    console.error("[Webhook MP] Unknown amount:", amount);
    // Default to PLAN_BASICO if amount doesn't match
    console.log("[Webhook MP] Defaulting to PLAN_BASICO");
  }

  const planType = planConfig?.type || payment.metadata?.plan_type || "PLAN_BASICO";
  const planDays = planConfig?.days || 40;

  // Check if subscription already exists for this payment
  const { data: existingSub } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("payment_reference", String(payment.id))
    .single();

  if (existingSub) {
    console.log("[Webhook MP] Subscription already exists for payment:", payment.id);
    return { status: "already_exists", subscription_id: existingSub.id };
  }

  // Create subscription
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + planDays);

  const { data: subscription, error: subError } = await supabaseAdmin
    .from("subscriptions")
    .insert({
      user_id: user.id,
      plan_type: planType,
      status: "active",
      start_date: new Date().toISOString(),
      end_date: endDate.toISOString(),
      payment_provider: "mercadopago",
      payment_reference: String(payment.id),
      amount_paid: amount,
    })
    .select("id")
    .single();

  if (subError) {
    console.error("[Webhook MP] Error creating subscription:", subError);
    throw subError;
  }

  // Update user profile
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      has_active_subscription: true,
      current_plan: planType,
      subscription_end_date: endDate.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    console.error("[Webhook MP] Error updating profile:", profileError);
    throw profileError;
  }

  console.log("[Webhook MP] Subscription activated:", {
    user: user.email,
    plan: planType,
    subscription_id: subscription.id,
    expires: endDate.toISOString(),
  });

  return {
    status: "activated",
    subscription_id: subscription.id,
    plan_type: planType,
    expires: endDate.toISOString(),
  };
}

// GET endpoint for webhook verification (MercadoPago sometimes pings this)
export async function GET() {
  return NextResponse.json({ status: "ok", service: "mercadopago-webhook" });
}
