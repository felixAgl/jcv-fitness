"use client";

import { Button } from "@/shared/components/ui";
import { ChevronDown, Dumbbell, Apple, Zap } from "lucide-react";

export function HeroSection() {
  const scrollToMealPlan = () => {
    document.getElementById("meal-plan")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="px-4 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
            Transforma tu vida
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          <span className="text-primary">JCV</span> FITNESS
        </h1>

        <p className="text-xl md:text-2xl text-foreground/70 mb-8 max-w-2xl mx-auto">
          Plan de alimentacion + Rutina de ejercicios personalizados para
          <span className="text-accent font-semibold"> transformar tu cuerpo</span> en tiempo record.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Button size="lg" onClick={scrollToMealPlan} className="gap-2">
            <Zap className="h-5 w-5" />
            Ver plan completo
          </Button>
          <Button variant="outline" size="lg" className="gap-2">
            <a href="#pricing">Ver precios</a>
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
              <Apple className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-foreground/60">Plan nutricional</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-2">
              <Dumbbell className="h-6 w-6 text-accent" />
            </div>
            <p className="text-sm text-foreground/60">Rutinas probadas</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-foreground/60">Resultados reales</p>
          </div>
        </div>
      </div>

      <button
        onClick={scrollToMealPlan}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-foreground/40 hover:text-primary transition-colors animate-bounce"
      >
        <ChevronDown className="h-8 w-8" />
      </button>
    </section>
  );
}
