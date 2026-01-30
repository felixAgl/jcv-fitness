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
    name: "Basico",
    durationMonths: 1,
    price: 49900,
    priceDisplay: "$49.900",
    features: [
      "Plan de alimentacion 7 dias",
      "Rutina de entrenamiento casa",
      "Acceso a la app",
      "Soporte por email",
    ],
  },
  {
    id: "PLAN_PRO",
    name: "Pro",
    durationMonths: 1,
    price: 89900,
    priceDisplay: "$89.900",
    features: [
      "Plan de alimentacion personalizado",
      "Rutina gimnasio + casa",
      "Videos de ejercicios",
      "Soporte prioritario",
      "Seguimiento semanal",
    ],
    popular: true,
  },
  {
    id: "PLAN_PREMIUM",
    name: "Premium",
    durationMonths: 1,
    price: 149900,
    priceDisplay: "$149.900",
    features: [
      "Todo lo del plan Pro",
      "Coaching 1 a 1",
      "Ajustes mensuales",
      "Acceso a comunidad VIP",
      "Garantia de resultados",
    ],
  },
];

export function getPlanDuration(planType: PlanType): number {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planType);
  return plan?.durationMonths || 1;
}
