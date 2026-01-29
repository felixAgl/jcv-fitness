"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui";
import { Check } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { CheckoutModal } from "./CheckoutModal";
import { JCVLogoMini } from "@/shared/components/JCVLogo";
import { useAuth, AuthModal } from "@/features/auth";
import { SUBSCRIPTION_PLANS, type PlanType } from "@/features/subscription";

export function PricingSection() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("PLAN_PRO");

  const handleSelectPlan = (planType: PlanType) => {
    setSelectedPlan(planType);
    // If still loading auth state, show auth modal anyway - it will handle the loading state
    if (isAuthenticated) {
      setIsCheckoutOpen(true);
    } else {
      setShowAuth(true);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
    setIsCheckoutOpen(true);
  };

  const handlePaymentSuccess = (transactionId: string, provider: string) => {
    setIsCheckoutOpen(false);
    const params = new URLSearchParams({
      payment_id: transactionId,
      status: "approved",
      external_reference: `JCV-${Date.now()}-${selectedPlan}`,
      provider: provider,
    });
    router.push(`/payment/success?${params.toString()}`);
  };

  const handlePaymentError = (error: string) => {
    console.error("Error en pago:", error);
  };

  return (
    <>
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <JCVLogoMini variant="cyan" size="md" />
              <span className="text-xl font-bold">
                <span className="text-primary">24</span>
                <span className="text-foreground/80"> FITNESS</span>
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Elige tu <span className="text-primary">plan</span>
            </h2>
            <p className="text-foreground/60 max-w-2xl mx-auto">
              Invierte en tu salud. Elige el plan que mejor se adapte a tus objetivos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {SUBSCRIPTION_PLANS.map((plan) => (
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
                    <span className="text-4xl font-bold">{plan.priceDisplay}</span>
                    <span className="text-foreground/60 ml-1">COP/mes</span>
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
        customerEmail={user?.email}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
      />

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        defaultMode="register"
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}
