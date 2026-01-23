"use client";

import { useState } from "react";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui";
import { Check } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { CheckoutModal } from "./CheckoutModal";

type PlanType = "PLAN_BASICO" | "PLAN_PRO" | "PLAN_PREMIUM";

interface PricingPlan {
  id: string;
  planType: PlanType;
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
}

const plans: PricingPlan[] = [
  {
    id: "basic",
    planType: "PLAN_BASICO",
    name: "Basico",
    price: "49.900",
    period: "COP/mes",
    features: [
      "Plan de alimentacion 7 dias",
      "Rutina de entrenamiento casa",
      "Acceso a la app",
      "Soporte por email",
    ],
  },
  {
    id: "pro",
    planType: "PLAN_PRO",
    name: "Pro",
    price: "89.900",
    period: "COP/mes",
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
    id: "premium",
    planType: "PLAN_PREMIUM",
    name: "Premium",
    price: "149.900",
    period: "COP/mes",
    features: [
      "Todo lo del plan Pro",
      "Coaching 1 a 1",
      "Ajustes mensuales",
      "Acceso a comunidad VIP",
      "Garantia de resultados",
    ],
  },
];

export function PricingSection() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("PLAN_PRO");

  const handleSelectPlan = (planType: PlanType) => {
    setSelectedPlan(planType);
    setIsCheckoutOpen(true);
  };

  const handlePaymentSuccess = (transactionId: string, provider: string) => {
    console.log(`Pago exitoso: ${transactionId} via ${provider}`);
    setIsCheckoutOpen(false);
  };

  const handlePaymentError = (error: string) => {
    console.error("Error en pago:", error);
  };

  return (
    <>
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Elige tu <span className="text-primary">plan</span>
            </h2>
            <p className="text-foreground/60 max-w-2xl mx-auto">
              Invierte en tu salud. Elige el plan que mejor se adapte a tus objetivos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={cn(
                  "relative",
                  plan.popular && "border-primary ring-2 ring-primary/20"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-background text-xs font-bold rounded-full">
                    Mas popular
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-foreground/60 ml-1">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.popular ? "primary" : "outline"}
                    className="w-full"
                    onClick={() => handleSelectPlan(plan.planType)}
                  >
                    Seleccionar plan
                  </Button>
                  <p className="text-xs text-foreground/40 text-center mt-3">
                    Pago seguro con Mercado Pago o Wompi
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        selectedPlan={selectedPlan}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
      />
    </>
  );
}
