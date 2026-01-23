"use client";

import { Card, CardContent } from "@/shared/components/ui";
import { Target, TrendingUp, Users, Clock } from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Enfoque personalizado",
    description: "Cada plan esta diseñado considerando tus objetivos, nivel de experiencia y preferencias alimenticias.",
  },
  {
    icon: TrendingUp,
    title: "Progresion gradual",
    description: "Sistema de fases que te lleva paso a paso hacia tu mejor version, sin atajos ni dietas extremas.",
  },
  {
    icon: Users,
    title: "Comunidad de apoyo",
    description: "Unete a cientos de personas que estan en el mismo camino de transformacion que tu.",
  },
  {
    icon: Clock,
    title: "Flexibilidad total",
    description: "Rutinas para gimnasio o casa, tabla de intercambios de alimentos. Adaptamos el plan a tu vida.",
  },
];

export function AboutSection() {
  return (
    <section className="py-20 px-4 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Por que <span className="text-primary">JCV Fitness</span>?
          </h2>
          <p className="text-foreground/60 max-w-2xl mx-auto">
            No vendemos milagros. Ofrecemos ciencia aplicada, disciplina guiada y
            un sistema probado para transformar tu fisico y tu salud.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} hover className="text-center">
              <CardContent className="pt-6">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-foreground/60">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
