"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import { useAuth, AuthModal } from "@/features/auth";
import { SUBSCRIPTION_PLANS, type PlanType } from "@/features/subscription";
import { CheckoutModal } from "@/features/payment/components/CheckoutModal";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui";
import { JCVLogoMini } from "@/shared/components/JCVLogo";
import { cn } from "@/shared/lib/cn";

export default function PricingPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  // Debug: show auth state on page
  useEffect(() => {
    console.log("[Pricing] Auth state:", { isLoading, isAuthenticated, user: user?.email });
  }, [isLoading, isAuthenticated, user]);

  const handleSelectPlan = (planId: PlanType) => {
    console.log("[Pricing] Plan selected:", planId, "isLoading:", isLoading, "isAuthenticated:", isAuthenticated, "user:", user?.email);
    setSelectedPlan(planId);

    // If auth is still loading, the effect below will handle it once loaded
    if (isLoading) {
      console.log("[Pricing] Auth still loading, waiting for useEffect...");
      return;
    }

    // Check both isAuthenticated and user to be safe
    if (isAuthenticated && user) {
      console.log("[Pricing] User authenticated, showing checkout for:", user.email);
      setShowCheckout(true);
    } else {
      console.log("[Pricing] User not authenticated, showing auth modal");
      setShowAuth(true);
    }
  };

  // Handle plan selection after auth state loads
  useEffect(() => {
    // Only trigger when we have a selected plan and no modal is showing
    if (!isLoading && selectedPlan && !showCheckout && !showAuth) {
      console.log("[Pricing] useEffect triggered - isAuthenticated:", isAuthenticated, "user:", user?.email);

      // Double-check auth state with user object
      if (isAuthenticated && user) {
        console.log("[Pricing] User confirmed authenticated, showing checkout");
        setShowCheckout(true);
      } else {
        console.log("[Pricing] User not authenticated, showing auth modal");
        setShowAuth(true);
      }
    }
  }, [isLoading, isAuthenticated, user, selectedPlan, showCheckout, showAuth]);

  // If user becomes authenticated while auth modal is open, switch to checkout
  useEffect(() => {
    if (showAuth && isAuthenticated && user && selectedPlan) {
      console.log("[Pricing] User authenticated while auth modal open, switching to checkout");
      setShowAuth(false);
      setShowCheckout(true);
    }
  }, [showAuth, isAuthenticated, user, selectedPlan]);

  const handleAuthSuccess = () => {
    setShowAuth(false);
    setShowCheckout(true);
  };

  const handlePaymentSuccess = (transactionId: string, provider: string) => {
    setShowCheckout(false);
    const params = new URLSearchParams({
      payment_id: transactionId,
      status: "approved",
      external_reference: `JCV-${Date.now()}-${selectedPlan}`,
      provider: provider,
    });
    router.push(`/payment/success?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4 hover:opacity-80 transition-opacity">
            <JCVLogoMini variant="cyan" size="md" />
            <span className="text-xl font-bold">
              <span className="text-primary">24</span>
              <span className="text-foreground/80"> FITNESS</span>
            </span>
          </Link>
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

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-foreground/40 hover:text-foreground text-sm transition-colors"
          >
            Volver
          </button>
        </div>
      </div>

      {selectedPlan && (
        <CheckoutModal
          isOpen={showCheckout}
          onClose={() => {
            setShowCheckout(false);
            setSelectedPlan(null);
          }}
          selectedPlan={selectedPlan}
          customerEmail={user?.email}
          onPaymentSuccess={handlePaymentSuccess}
          showStepIndicator={true}
        />
      )}

      <AuthModal
        isOpen={showAuth}
        onClose={() => {
          setShowAuth(false);
          setSelectedPlan(null);
        }}
        defaultMode="register"
        onSuccess={handleAuthSuccess}
        showStepIndicator={true}
        planName={selectedPlan ? SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.name : undefined}
      />
    </div>
  );
}
