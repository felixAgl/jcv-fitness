import type { WizardState } from "@/features/wizard/types";

export type PlanType = "free" | "paid";

export type PlanStatus = "active" | "expired";

export interface UserPlan {
  id: string;
  userId: string;
  planData: WizardState;
  planType: PlanType;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  downloadCount: number;
  updatedAt: Date;
}

export interface UserPlanRow {
  id: string;
  user_id: string;
  plan_data: WizardState;
  plan_type: PlanType;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  download_count: number;
  updated_at: string;
}

export interface ActivePlanResult {
  id: string;
  plan_data: WizardState;
  plan_type: PlanType;
  created_at: string;
  expires_at: string;
  is_expired: boolean;
  days_remaining: number;
  download_count: number;
}

export interface CanCreatePlanResult {
  can_create: boolean;
  reason: "already_has_plan" | "free_used" | null;
}

export function mapRowToUserPlan(row: UserPlanRow): UserPlan {
  return {
    id: row.id,
    userId: row.user_id,
    planData: row.plan_data,
    planType: row.plan_type,
    createdAt: new Date(row.created_at),
    expiresAt: new Date(row.expires_at),
    isActive: row.is_active,
    downloadCount: row.download_count,
    updatedAt: new Date(row.updated_at),
  };
}

export function mapActivePlanResult(row: ActivePlanResult): UserPlan & {
  isExpired: boolean;
  daysRemaining: number;
} {
  return {
    id: row.id,
    userId: "", // Not returned from function
    planData: row.plan_data,
    planType: row.plan_type,
    createdAt: new Date(row.created_at),
    expiresAt: new Date(row.expires_at),
    isActive: !row.is_expired,
    downloadCount: row.download_count,
    updatedAt: new Date(row.created_at), // Same as created for active
    isExpired: row.is_expired,
    daysRemaining: row.days_remaining,
  };
}
