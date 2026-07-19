import { createClient } from "@/lib/supabase/client";
import type { Subscription } from "../types";

/**
 * SubscriptionService — READ-ONLY over entitlement state.
 *
 * SECURITY: This service must NEVER write subscriptions rows or profiles
 * entitlement columns (has_active_subscription, current_plan,
 * subscription_end_date). Those are granted exclusively by a VERIFIED payment
 * through the Cloudflare Worker webhook (Supabase service role). A client-side
 * write here was the self-grant vulnerability: a user could visit
 * /payment/success?status=approved&external_reference=... and mint a paid plan
 * without paying. The RLS lockdown migration
 * (20260718120000_security_rls_lockdown.sql) enforces this at the database
 * level; this service is the aligned client contract.
 *
 * - Activation: the success page POLLS for the worker-created row (see
 *   getActiveSubscription / findSubscriptionByPaymentReference). No client insert.
 * - Cancellation: routed through the `cancel_subscription` SECURITY DEFINER RPC
 *   (auth.uid()-scoped), NOT a direct UPDATE.
 * - Expiration: handled by the worker cron (expire_old_subscriptions RPC,
 *   service role). No client expiry sweep.
 */
export class SubscriptionService {
  private getSupabase() {
    const supabase = createClient();
    if (!supabase) {
      throw new Error("Supabase not initialized");
    }
    return supabase;
  }

  async getActiveSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await this.getSupabase()
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .gte("end_date", new Date().toISOString())
      .order("end_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    // maybeSingle returns null when no rows found (instead of error 406)
    if (error) {
      console.error("[SubscriptionService] Error fetching subscription:", error);
      return null;
    }
    return data;
  }

  /**
   * Find the subscription created by the webhook for a specific payment.
   *
   * Used by the payment/success page to POLL for the worker-created row after a
   * redirect. RLS restricts SELECT to the caller's own rows, so this can only
   * ever return the authenticated user's subscription. This is a READ — it does
   * not (and must not) create anything.
   *
   * @param paymentReference the MercadoPago payment id (payment_id / collection_id
   *   from the success URL), which the worker stores as payment_reference.
   */
  async findSubscriptionByPaymentReference(
    paymentReference: string
  ): Promise<Subscription | null> {
    if (!paymentReference) return null;

    const { data, error } = await this.getSupabase()
      .from("subscriptions")
      .select("*")
      .eq("payment_reference", paymentReference)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        "[SubscriptionService] Error polling subscription by reference:",
        error
      );
      return null;
    }
    return data;
  }

  /**
   * Cancel a subscription through the auth.uid()-scoped SECURITY DEFINER RPC.
   *
   * Direct client UPDATE of subscriptions.status and of profiles entitlement
   * columns is blocked by the RLS lockdown, so cancellation goes through
   * `cancel_subscription` (see migrations/*_cancel_subscription_rpc.sql). The
   * RPC verifies ownership server-side and resets the profile entitlement when
   * no other active subscription remains.
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    const { data, error } = await this.getSupabase().rpc("cancel_subscription", {
      p_subscription_id: subscriptionId,
    });

    if (error) throw new Error(error.message);
    // The RPC returns false when the subscription does not exist or is not owned
    // by the caller. Surface that as a not-found error for the UI.
    if (data === false) throw new Error("Subscription not found");
  }

  async getSubscriptionHistory(userId: string): Promise<Subscription[]> {
    const { data, error } = await this.getSupabase()
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }
}

export const subscriptionService = new SubscriptionService();
