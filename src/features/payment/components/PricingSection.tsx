"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui";
import { Check, ShieldCheck } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { CheckoutModal } from "./CheckoutModal";
import { JCVLogoMini } from "@/shared/components/JCVLogo";
import { useAuth, AuthModal } from "@/features/auth";
import { SUBSCRIPTION_PLANS, type PlanType } from "@/features/subscription";
import { useLanguage } from "@/features/shared/hooks/useLanguage";
import { track } from "@/features/shared/analytics/track";
import { LANDING_STRINGS } from "@/features/landing/i18n";
import { buildWhatsAppUrl } from "@/features/landing/utils/whatsapp";
import { WhatsAppIcon } from "@/features/landing/components/WhatsAppIcon";

export function PricingSection() {
  const router = useRouter();
  const { lang } = useLanguage();
  const t = LANDING_STRINGS[lang].pricing;
  const guarantee = LANDING_STRINGS[lang].guarantee;
  const whatsapp = LANDING_STRINGS[lang].whatsapp;
  const { isAuthenticated, user, isLoading } = useAuth();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("PLAN_PRO");

  const handleSelectPlan = (planType: PlanType) => {
    track("checkout_click", undefined, planType);
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
              {t.titlePre}<span className="text-primary">{t.titleHighlight}</span>
            </h2>
            <p className="text-foreground/60 max-w-2xl mx-auto">{t.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={cn(
                  "relative hover-lift",
                  plan.popular && "border-primary ring-2 ring-primary/20 glow-cyan-soft"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-background text-xs font-bold rounded-full">
                    {t.popularBadge}
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="font-display text-5xl tracking-wide">{plan.priceDisplay}</span>
                    <span className="text-foreground/60 ml-1">{t.perMonth}</span>
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
                    {t.selectPlan}
                  </Button>
                  {/* NOTE: 40-day guarantee is a business commitment pending
                      owner confirmation before production. */}
                  <p className="flex items-start justify-center gap-1.5 text-xs text-foreground/60 text-center mt-3">
                    <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                    <span>{guarantee.text}</span>
                  </p>
                  <a
                    href={buildWhatsAppUrl(whatsapp.planMessage.replace("{plan}", plan.name))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 text-xs text-foreground/60 hover:text-foreground mt-2 transition-colors"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5 text-green-500" />
                    {t.whatsappAsk}
                  </a>
                  <p className="text-xs text-foreground/40 text-center mt-3">
                    {t.securePayment}
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
        userId={user?.id}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
        showStepIndicator={true}
      />

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        defaultMode="register"
        onSuccess={handleAuthSuccess}
        showStepIndicator={true}
        planName={SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.name}
      />
    </>
  );
}
