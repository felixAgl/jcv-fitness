import type { Tables } from "@/lib/supabase/database.types";

export type Subscription = Tables<"subscriptions">;
export type Profile = Tables<"profiles">;
export type WizardData = Tables<"wizard_data">;
export type PlanDownload = Tables<"plan_downloads">;

export type PlanType = "PLAN_BASICO" | "PLAN_PRO" | "PLAN_PREMIUM";
export type SubscriptionStatus = "active" | "expired" | "cancelled";
export type PaymentProvider = "mercadopago" | "wompi";

export interface SubscriptionPlan {
  id: PlanType;
  name: string;
  durationMonths: number;
  price: number;
  priceDisplay: string;
  features: string[];
  popular?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "PLAN_BASICO",
    name: "Plan Basico",
    durationMonths: 1,
    price: 50000,
    priceDisplay: "$50.000 COP",
    features: [
      "Plan de alimentacion personalizado",
      "Rutina de ejercicios",
      "Acceso por 1 mes",
      "Soporte por WhatsApp",
    ],
  },
  {
    id: "PLAN_PRO",
    name: "Plan Pro",
    durationMonths: 2,
    price: 80000,
    priceDisplay: "$80.000 COP",
    features: [
      "Todo del Plan Basico",
      "Ajustes semanales del plan",
      "Acceso por 2 meses",
      "Seguimiento personalizado",
    ],
    popular: true,
  },
  {
    id: "PLAN_PREMIUM",
    name: "Plan Premium",
    durationMonths: 3,
    price: 100000,
    priceDisplay: "$100.000 COP",
    features: [
      "Todo del Plan Pro",
      "Consultas ilimitadas",
      "Acceso por 3 meses",
      "Videos de ejercicios",
      "Recetas adicionales",
    ],
  },
];

export function getPlanDuration(planType: PlanType): number {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planType);
  return plan?.durationMonths || 1;
}
