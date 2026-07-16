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
  /** True when the plan shown is a localStorage mirror (fetch failed). */
  isOffline: boolean;
}

// Offline mirror of the last successfully fetched plan (PWA gym-basement
// mode): lets /plan/view render from cache when Supabase is unreachable.
const PLAN_CACHE_PREFIX = "jcv-plan-cache-";

function savePlanMirror(userId: string, plan: ActivePlan | null) {
  try {
    const key = `${PLAN_CACHE_PREFIX}${userId}`;
    if (plan) {
      window.localStorage.setItem(key, JSON.stringify(plan));
    } else {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Storage unavailable/full: offline fallback simply won't exist.
  }
}

function readPlanMirror(userId: string): ActivePlan | null {
  try {
    const raw = window.localStorage.getItem(`${PLAN_CACHE_PREFIX}${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActivePlan;
    // Revive Dates (JSON serialized them as ISO strings) and recompute
    // expiry locally so a stale mirror never shows wrong days remaining.
    const expiresAt = new Date(parsed.expiresAt);
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
      updatedAt: new Date(parsed.updatedAt),
      expiresAt,
      isExpired: planService.isPlanExpired(expiresAt),
      daysRemaining: planService.getDaysRemaining(expiresAt),
    };
  } catch {
    return null;
  }
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
    isOffline: false,
  });

  const fetchPlan = useCallback(async () => {
    if (!user?.id) {
      setState({
        plan: null,
        isLoading: false,
        error: null,
        canCreatePlan: false,
        canCreateReason: "not_authenticated",
        isOffline: false,
      });
      return;
    }
    const userId = user.id;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch both plan and canCreate status in parallel
      const [planResult, canCreateResult] = await Promise.all([
        planService.getActivePlan(userId),
        planService.canCreatePlan(userId),
      ]);

      if (planResult.error) {
        // Fetch failed (offline gym, flaky data): serve the last mirror.
        const mirrored = readPlanMirror(userId);
        setState({
          plan: mirrored,
          isLoading: false,
          error: mirrored ? null : planResult.error,
          canCreatePlan: canCreateResult.canCreate,
          canCreateReason: canCreateResult.reason,
          isOffline: mirrored !== null,
        });
        return;
      }

      savePlanMirror(userId, planResult.plan);
      setState({
        plan: planResult.plan,
        isLoading: false,
        error: null,
        canCreatePlan: canCreateResult.canCreate,
        canCreateReason: canCreateResult.reason,
        isOffline: false,
      });
    } catch (error) {
      const mirrored = readPlanMirror(userId);
      setState({
        plan: mirrored,
        isLoading: false,
        error: mirrored
          ? null
          : error instanceof Error ? error.message : "Error desconocido",
        canCreatePlan: false,
        canCreateReason: undefined,
        isOffline: mirrored !== null,
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
