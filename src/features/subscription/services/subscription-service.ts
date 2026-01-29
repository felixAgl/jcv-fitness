import { createClient } from "@/lib/supabase/client";
import type { PlanType, PaymentProvider, Subscription } from "../types";
import { getPlanDuration } from "../types";

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
      .single();

    if (error || !data) return null;
    return data;
  }

  async createSubscription(params: {
    userId: string;
    planType: PlanType;
    paymentProvider: PaymentProvider;
    paymentReference: string;
    amountPaid: number;
  }): Promise<Subscription> {
    const durationMonths = getPlanDuration(params.planType);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationMonths);

    const { data, error } = await this.getSupabase()
      .from("subscriptions")
      .insert({
        user_id: params.userId,
        plan_type: params.planType,
        status: "active",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        payment_provider: params.paymentProvider,
        payment_reference: params.paymentReference,
        amount_paid: params.amountPaid,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Failed to create subscription");

    // Update profile
    await this.getSupabase()
      .from("profiles")
      .update({
        has_active_subscription: true,
        current_plan: params.planType,
        subscription_end_date: endDate.toISOString(),
      })
      .eq("id", params.userId);

    return data;
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const { data: subscription, error: fetchError } = await this.getSupabase()
      .from("subscriptions")
      .select("user_id")
      .eq("id", subscriptionId)
      .single();

    if (fetchError || !subscription) {
      throw new Error("Subscription not found");
    }

    const { error } = await this.getSupabase()
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("id", subscriptionId);

    if (error) throw new Error(error.message);

    // Check if user has other active subscriptions
    const { data: otherSubs } = await this.getSupabase()
      .from("subscriptions")
      .select("id")
      .eq("user_id", subscription.user_id)
      .eq("status", "active")
      .neq("id", subscriptionId)
      .limit(1);

    if (!otherSubs || otherSubs.length === 0) {
      await this.getSupabase()
        .from("profiles")
        .update({
          has_active_subscription: false,
          current_plan: null,
          subscription_end_date: null,
        })
        .eq("id", subscription.user_id);
    }
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

  async checkAndExpireSubscriptions(): Promise<void> {
    const now = new Date().toISOString();

    // Get all expired subscriptions
    const { data: expiredSubs, error: fetchError } = await this.getSupabase()
      .from("subscriptions")
      .select("id, user_id")
      .eq("status", "active")
      .lt("end_date", now);

    if (fetchError || !expiredSubs) return;

    for (const sub of expiredSubs) {
      await this.getSupabase()
        .from("subscriptions")
        .update({ status: "expired" })
        .eq("id", sub.id);

      // Check if user has other active subscriptions
      const { data: otherSubs } = await this.getSupabase()
        .from("subscriptions")
        .select("id")
        .eq("user_id", sub.user_id)
        .eq("status", "active")
        .limit(1);

      if (!otherSubs || otherSubs.length === 0) {
        await this.getSupabase()
          .from("profiles")
          .update({
            has_active_subscription: false,
            current_plan: null,
            subscription_end_date: null,
          })
          .eq("id", sub.user_id);
      }
    }
  }
}

export const subscriptionService = new SubscriptionService();
