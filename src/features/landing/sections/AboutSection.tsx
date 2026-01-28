"use client";

import Image from "next/image";
import { Card, CardContent } from "@/shared/components/ui";
import { Target, TrendingUp, Users, Clock } from "lucide-react";
import { transformationImages } from "../data/transformations";
import { JCVLogoMini } from "@/shared/components/JCVLogo";

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
  const jcvImage = transformationImages[3]; // gym-pose-1

  return (
    <section className="py-20 px-4 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="relative">
            <div className="relative aspect-[3/4] max-w-md mx-auto rounded-2xl overflow-hidden">
              <Image
                src={jcvImage.url}
                alt={jcvImage.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4 border border-accent-cyan/30">
                  <div className="flex items-center gap-2 mb-1">
                    <JCVLogoMini variant="cyan" size="sm" />
                    <span className="text-accent-cyan font-bold text-lg">24 FITNESS</span>
                  </div>
                  <p className="text-gray-300 text-sm">Entrenador Personal Certificado</p>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent-red/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent-cyan/20 rounded-full blur-3xl" />
          </div>

          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              ¿Por qué <span className="text-primary">JCV 24 Fitness</span>?
            </h2>
            <p className="text-foreground/60 mb-6 text-lg">
              No vendemos milagros. Ofrecemos ciencia aplicada, disciplina guiada y
              un sistema probado para transformar tu físico y tu salud.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent-green" />
                <span className="text-foreground/80">Más de 500 clientes transformados</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent-green" />
                <span className="text-foreground/80">Metodología basada en ciencia</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent-green" />
                <span className="text-foreground/80">Acompañamiento personalizado</span>
              </div>
            </div>
          </div>
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
