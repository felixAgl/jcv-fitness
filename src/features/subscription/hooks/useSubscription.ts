"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/features/auth";
import { subscriptionService } from "../services/subscription-service";
import type { Subscription, PlanType, PaymentProvider } from "../types";

export function useSubscription() {
  const { user, profile } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const sub = await subscriptionService.getActiveSubscription(user.id);
      setSubscription(sub);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading subscription");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const createSubscription = async (params: {
    planType: PlanType;
    paymentProvider: PaymentProvider;
    paymentReference: string;
    amountPaid: number;
  }) => {
    if (!user) throw new Error("User not authenticated");

    const newSub = await subscriptionService.createSubscription({
      userId: user.id,
      ...params,
    });

    setSubscription(newSub);
    return newSub;
  };

  const cancelSubscription = async () => {
    if (!subscription) throw new Error("No active subscription");

    await subscriptionService.cancelSubscription(subscription.id);
    setSubscription(null);
  };

  const hasActiveSubscription = profile?.has_active_subscription ?? false;
  const daysRemaining = subscription
    ? Math.max(0, Math.ceil((new Date(subscription.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    subscription,
    isLoading,
    error,
    hasActiveSubscription,
    daysRemaining,
    createSubscription,
    cancelSubscription,
    refresh: loadSubscription,
  };
}
