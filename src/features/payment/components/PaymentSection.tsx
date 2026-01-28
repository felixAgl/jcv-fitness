"use client";

import { Card } from "@/shared/components/ui";
import { CreditCard, ShieldCheck, Sparkles } from "lucide-react";
import { PricingCard } from "./PricingCard";

const pricingPlans = [
  {
    name: "Básico",
    price: "149.000",
    features: [
      "Plan de alimentación personalizado",
      "Rutina de ejercicios para casa",
      "Acceso a videos de técnica",
      "Soporte por WhatsApp",
    ],
  },
  {
    name: "Transformación",
    price: "249.000",
    highlighted: true,
    features: [
      "Todo lo del plan Básico",
      "Rutina de gimnasio completa",
      "Tabla de intercambios de alimentos",
      "Plan de suplementación",
      "Seguimiento semanal",
      "Grupo exclusivo de Telegram",
    ],
  },
  {
    name: "Elite",
    price: "399.000",
    features: [
      "Todo lo del plan Transformación",
      "Coaching 1 a 1 semanal",
      "Ajustes ilimitados de dieta",
      "Programa de cardio personalizado",
      "Acceso de por vida a actualizaciones",
    ],
  },
];

export function PaymentSection() {
  const handleSelectPlan = (planName: string) => {
    console.log(`Plan seleccionado: ${planName}`);
    alert(`Próximamente: Pago con Mercado Pago o Wompi para ${planName}`);
  };

  return (
    <section id="pricing" className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Invierte en tu <span className="text-primary">Transformación</span>
          </h2>
          <p className="text-foreground/60 max-w-2xl mx-auto">
            Elige el plan que mejor se adapte a tus objetivos.
            Todos incluyen garantía de satisfacción de 30 días.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {pricingPlans.map((plan) => (
            <PricingCard
              key={plan.name}
              {...plan}
              onSelect={() => handleSelectPlan(plan.name)}
            />
          ))}
        </div>

        <Card className="p-6 bg-card/50 border-dashed">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center md:text-left">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">Pasarela de Pago</h3>
                <p className="text-sm text-foreground/60">Mercado Pago / Wompi</p>
              </div>
            </div>
            <div className="h-px md:h-12 md:w-px bg-border w-full md:w-auto" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">Pago Seguro</h3>
                <p className="text-sm text-foreground/60">Encriptación SSL</p>
              </div>
            </div>
            <div className="h-px md:h-12 md:w-px bg-border w-full md:w-auto" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-bold">Próximamente</h3>
                <p className="text-sm text-foreground/60">Integración en progreso</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
