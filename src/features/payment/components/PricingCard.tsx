"use client";

import { Card, Button } from "@/shared/components/ui";
import { Check } from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface PricingCardProps {
  name: string;
  price: string;
  currency?: string;
  period?: string;
  features: string[];
  highlighted?: boolean;
  ctaText?: string;
  onSelect?: () => void;
}

export function PricingCard({
  name,
  price,
  currency = "COP",
  period = "/mes",
  features,
  highlighted = false,
  ctaText = "Comenzar ahora",
  onSelect,
}: PricingCardProps) {
  return (
    <Card
      className={cn(
        "relative p-6 flex flex-col h-full",
        highlighted && "border-primary border-2 shadow-lg shadow-primary/20"
      )}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-background text-xs font-bold rounded-full">
          RECOMENDADO
        </div>
      )}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold mb-2">{name}</h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-sm text-foreground/60">{currency}</span>
          <span className="text-4xl font-bold text-primary">{price}</span>
          <span className="text-sm text-foreground/60">{period}</span>
        </div>
      </div>
      <ul className="space-y-3 mb-8 flex-1">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <span className="text-sm text-foreground/80">{feature}</span>
          </li>
        ))}
      </ul>
      <Button
        variant={highlighted ? "primary" : "outline"}
        className="w-full"
        onClick={onSelect}
      >
        {ctaText}
      </Button>
    </Card>
  );
}
