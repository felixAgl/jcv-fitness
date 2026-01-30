"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/features/auth";
import { createClient } from "@/lib/supabase/client";
import { planService } from "../services/plan-service";
import type { UserPlan, PlanType } from "../types";
import type { WizardState } from "@/features/wizard/types";

interface ActivePlan extends UserPlan {
  isExpired: boolean;
  daysRemaining: number;
}

interface UsePlanState {
  plan: ActivePlan | null;
  isLoading: boolean;
  error: string | null;
  canCreatePlan: boolean;
  canCreateReason?: "already_has_plan" | "free_used" | "not_authenticated";
}

interface UsePlanActions {
  createPlan: (
    planData: WizardState,
    planType?: PlanType
  ) => Promise<{ success: boolean; planId?: string; error?: string }>;
  refreshPlan: () => Promise<void>;
  registerDownload: () => Promise<boolean>;
}

export function usePlan(): UsePlanState & UsePlanActions {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [state, setState] = useState<UsePlanState>({
    plan: null,
    isLoading: true,
    error: null,
    canCreatePlan: false,
    canCreateReason: undefined,
  });

  const fetchPlan = useCallback(async () => {
    if (!user?.id) {
      setState({
        plan: null,
        isLoading: false,
        error: null,
        canCreatePlan: false,
        canCreateReason: "not_authenticated",
      });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch both plan and canCreate status in parallel
      const [planResult, canCreateResult] = await Promise.all([
        planService.getActivePlan(user.id),
        planService.canCreatePlan(user.id),
      ]);

      if (planResult.error) {
        setState({
          plan: null,
          isLoading: false,
          error: planResult.error,
          canCreatePlan: canCreateResult.canCreate,
          canCreateReason: canCreateResult.reason,
        });
        return;
      }

      setState({
        plan: planResult.plan,
        isLoading: false,
        error: null,
        canCreatePlan: canCreateResult.canCreate,
        canCreateReason: canCreateResult.reason,
      });
    } catch (error) {
      setState({
        plan: null,
        isLoading: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        canCreatePlan: false,
        canCreateReason: undefined,
      });
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isAuthLoading) {
      fetchPlan();
    }
  }, [isAuthLoading, fetchPlan]);

  const createPlan = useCallback(
    async (planData: WizardState, planType: PlanType = "free") => {
      // Try to get user from context, if not available get directly from Supabase
      // This handles the race condition after login when context hasn't updated yet
      let userId = user?.id;

      if (!userId) {
        try {
          const supabase = createClient();
          if (supabase) {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            userId = currentUser?.id;
          }
        } catch {
          // Ignore errors, will be handled below
        }
      }

      if (!userId) {
        return { success: false, error: "Usuario no autenticado" };
      }

      const result = await planService.createPlan(userId, planData, planType);

      if (result.success) {
        // Refresh plan data after creation
        await fetchPlan();
      }

      return result;
    },
    [user?.id, fetchPlan]
  );

  const registerDownload = useCallback(async () => {
    if (!state.plan?.id) {
      return false;
    }

    return planService.registerDownload(state.plan.id);
  }, [state.plan?.id]);

  return {
    ...state,
    createPlan,
    refreshPlan: fetchPlan,
    registerDownload,
  };
}
