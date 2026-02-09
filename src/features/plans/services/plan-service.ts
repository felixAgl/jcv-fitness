import { createClient } from "@/lib/supabase/client";
import type { WizardState } from "@/features/wizard/types";
import type {
  UserPlan,
  PlanType,
  ActivePlanResult,
  CanCreatePlanResult,
  mapActivePlanResult,
} from "../types";

export interface CreatePlanResult {
  success: boolean;
  planId?: string;
  error?: string;
}

export interface GetActivePlanResult {
  plan: (UserPlan & { isExpired: boolean; daysRemaining: number }) | null;
  error?: string;
}

export interface CanCreatePlanResponse {
  canCreate: boolean;
  reason?: "already_has_plan" | "free_used" | "not_authenticated";
}

class PlanService {
  private getClient() {
    const client = createClient();
    if (!client) {
      throw new Error("Supabase client not available");
    }
    return client;
  }

  /**
   * Check if user can create a new plan
   */
  async canCreatePlan(userId: string): Promise<CanCreatePlanResponse> {
    try {
      const supabase = this.getClient();

      const { data, error } = await supabase.rpc("can_create_plan", {
        user_uuid: userId,
      });

      if (error) {
        console.error("Error checking if user can create plan:", error);
        return { canCreate: false, reason: "not_authenticated" };
      }

      const result = data as CanCreatePlanResult[] | null;
      if (!result || result.length === 0) {
        return { canCreate: false, reason: "not_authenticated" };
      }

      return {
        canCreate: result[0].can_create,
        reason: result[0].reason ?? undefined,
      };
    } catch (error) {
      console.error("Error in canCreatePlan:", error);
      return { canCreate: false, reason: "not_authenticated" };
    }
  }

  /**
   * Create a new plan for the user
   */
  async createPlan(
    userId: string,
    planData: WizardState,
    planType: PlanType = "free"
  ): Promise<CreatePlanResult> {
    try {
      const supabase = this.getClient();

      // First check if user can create a plan
      const canCreate = await this.canCreatePlan(userId);
      if (!canCreate.canCreate) {
        return {
          success: false,
          error:
            canCreate.reason === "already_has_plan"
              ? "Ya tienes un plan activo"
              : canCreate.reason === "free_used"
                ? "Ya usaste tu plan gratuito. Actualiza a premium para crear más planes."
                : "No se pudo verificar tu cuenta",
        };
      }

      const { data, error } = await supabase.rpc("create_user_plan", {
        user_uuid: userId,
        p_plan_data: planData,
        p_plan_type: planType,
      });

      if (error) {
        console.error("Error creating plan:", error);
        return { success: false, error: error.message };
      }

      return { success: true, planId: data as string };
    } catch (error) {
      console.error("Error in createPlan:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }

  /**
   * Get the active plan for a user
   */
  async getActivePlan(userId: string): Promise<GetActivePlanResult> {
    try {
      const supabase = this.getClient();

      const { data, error } = await supabase.rpc("get_active_plan", {
        user_uuid: userId,
      });

      if (error) {
        console.error("Error getting active plan:", error);
        return { plan: null, error: error.message };
      }

      const result = data as ActivePlanResult[] | null;
      if (!result || result.length === 0) {
        return { plan: null };
      }

      const row = result[0];
      return {
        plan: {
          id: row.id,
          userId: userId,
          planData: row.plan_data,
          planType: row.plan_type,
          createdAt: new Date(row.created_at),
          expiresAt: new Date(row.expires_at),
          isActive: !row.is_expired,
          downloadCount: row.download_count,
          updatedAt: new Date(row.created_at),
          isExpired: row.is_expired,
          daysRemaining: row.days_remaining,
        },
      };
    } catch (error) {
      console.error("Error in getActivePlan:", error);
      return {
        plan: null,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }

  /**
   * Check if a plan is expired (client-side check)
   */
  isPlanExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  /**
   * Calculate days remaining for a plan
   */
  getDaysRemaining(expiresAt: Date): number {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  /**
   * Register a download (only works for paid users)
   */
  async registerDownload(planId: string): Promise<boolean> {
    try {
      const supabase = this.getClient();

      const { data, error } = await supabase.rpc("register_plan_download", {
        plan_uuid: planId,
      });

      if (error) {
        console.error("Error registering download:", error);
        return false;
      }

      return data as boolean;
    } catch (error) {
      console.error("Error in registerDownload:", error);
      return false;
    }
  }

  /**
   * Expire old plans (utility function, usually called server-side)
   */
  async expireOldPlans(): Promise<number> {
    try {
      const supabase = this.getClient();

      const { data, error } = await supabase.rpc("expire_old_plans");

      if (error) {
        console.error("Error expiring old plans:", error);
        return 0;
      }

      return data as number;
    } catch (error) {
      console.error("Error in expireOldPlans:", error);
      return 0;
    }
  }
}

export const planService = new PlanService();
