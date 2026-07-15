"use client";

import { Dumbbell, Utensils, Calendar, Target, Download, Trophy } from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Tu Objetivo",
    description: "Perder grasa, ganar musculo o mantenerte. Todo adaptado a ti.",
    color: "cyan",
  },
  {
    icon: Dumbbell,
    title: "Plan de Ejercicios",
    description: "Rutinas con series, repeticiones y descansos detallados.",
    color: "red",
  },
  {
    icon: Utensils,
    title: "Plan Nutricional",
    description: "5 comidas diarias con macros y calorias calculadas.",
    color: "green",
  },
  {
    icon: Calendar,
    title: "Calendario Semanal",
    description: "Checkboxes de progreso para cada dia de entrenamiento.",
    color: "purple",
  },
  {
    icon: Download,
    title: "PDF Profesional",
    description: "Descarga tu plan completo en formato PDF elegante.",
    color: "orange",
  },
  {
    icon: Trophy,
    title: "Seguimiento",
    description: "Dashboard para ver tu progreso y mantener la motivacion.",
    color: "yellow",
  },
];

const cyanBadge = "bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30";

const colorClasses = {
  cyan: cyanBadge,
  red: cyanBadge,
  green: cyanBadge,
  purple: cyanBadge,
  orange: cyanBadge,
  yellow: cyanBadge,
};

export function FeaturesGrid() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4">
          <span className="text-white">Todo lo que </span>
          <span className="text-accent-cyan">INCLUYE</span>
          <span className="text-white"> tu plan</span>
        </h2>
        <p className="text-xl text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          Un sistema completo para transformar tu cuerpo de manera profesional
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            const colors = colorClasses[feature.color as keyof typeof colorClasses];

            return (
              <div
                key={feature.title}
                className="bg-card border border-gray-800 rounded-2xl p-6 hover:border-accent-cyan/50 transition-all group"
              >
                <div className={`w-14 h-14 rounded-xl ${colors} flex items-center justify-center mb-4 border`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-accent-cyan transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
