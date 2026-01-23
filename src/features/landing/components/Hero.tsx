"use client";

import { Button } from "@/shared/components/ui";
import { ArrowRight, Dumbbell, Utensils } from "lucide-react";

export function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 pt-16">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          Transforma tu{" "}
          <span className="text-primary">cuerpo</span>
          <br />
          Transforma tu{" "}
          <span className="text-accent">vida</span>
        </h1>
        <p className="text-xl text-foreground/70 mb-8 max-w-2xl mx-auto">
          Plan de alimentacion y entrenamiento personalizado. Resultados reales con JCV Fitness.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button size="lg" className="gap-2">
            Comenzar ahora
            <ArrowRight className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="lg">
            Ver planes
          </Button>
        </div>
        <div className="flex justify-center gap-8">
          <div className="flex items-center gap-2 text-foreground/60">
            <Utensils className="h-5 w-5 text-primary" />
            <span>Plan nutricional</span>
          </div>
          <div className="flex items-center gap-2 text-foreground/60">
            <Dumbbell className="h-5 w-5 text-accent" />
            <span>Rutinas de ejercicio</span>
          </div>
        </div>
      </div>
    </section>
  );
}
