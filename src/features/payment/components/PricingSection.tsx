"use client";

import { Button, Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui";
import { Check } from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
}

const plans: PricingPlan[] = [
  {
    id: "basic",
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
  const handleSelectPlan = (planId: string) => {
    console.log("Plan seleccionado:", planId);
  };

  return (
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
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  Seleccionar plan
                </Button>
                <p className="text-xs text-foreground/40 text-center mt-3">
                  Pago con Mercado Pago o Wompi (proximamente)
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
