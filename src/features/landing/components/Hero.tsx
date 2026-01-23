"use client";

import Link from "next/link";
import { ArrowRight, Dumbbell, Utensils } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 pt-16 overflow-hidden">
      <div className="bg-pattern" />
      <div className="bg-particles" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-black mb-6">
          <span className="text-white">TRANSFORMA TU</span>{" "}
          <span className="text-accent-cyan glow-cyan">CUERPO</span>
          <br />
          <span className="text-white">TRANSFORMA TU</span>{" "}
          <span className="text-accent-red glow-red">VIDA</span>
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Plan de alimentacion y entrenamiento personalizado. Resultados reales con JCV Fitness.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            href="/wizard"
            className="btn-cta inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold"
          >
            COMENZAR AHORA
            <ArrowRight className="h-5 w-5" />
          </Link>
          <a
            href="#pricing"
            className="px-8 py-4 rounded-lg font-bold border-2 border-gray-700 text-gray-300 hover:border-accent-cyan hover:text-accent-cyan transition-all"
          >
            Ver planes
          </a>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          <div className="flex items-center gap-2 text-gray-400">
            <Utensils className="h-5 w-5 text-accent-cyan" />
            <span>Plan nutricional</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Dumbbell className="h-5 w-5 text-accent-red" />
            <span>Rutinas de ejercicio</span>
          </div>
        </div>
      </div>
    </section>
  );
}
