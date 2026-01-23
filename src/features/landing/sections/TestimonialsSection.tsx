"use client";

import { Card, CardContent } from "@/shared/components/ui";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Carlos M.",
    role: "Perdio 15kg en 4 meses",
    content: "El plan de alimentacion es increible. No sentia que estaba a dieta porque la comida es deliciosa y variada.",
    rating: 5,
  },
  {
    name: "Maria L.",
    role: "Gano masa muscular",
    content: "Nunca pense que podria entrenar en casa con tan buenos resultados. Las rutinas son completas y bien explicadas.",
    rating: 5,
  },
  {
    name: "Andres P.",
    role: "Transformacion total",
    content: "El sistema de fases es genial. Cada mes sentia que avanzaba y los resultados hablaban por si solos.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Lo que dicen nuestros <span className="text-accent">clientes</span>
          </h2>
          <p className="text-foreground/60 max-w-2xl mx-auto">
            Historias reales de personas reales que transformaron sus vidas con JCV Fitness.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} hover className="relative">
              <CardContent className="pt-6">
                <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/20" />
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground/80 mb-4 italic">&ldquo;{testimonial.content}&rdquo;</p>
                <div className="border-t border-border pt-4">
                  <p className="font-bold">{testimonial.name}</p>
                  <p className="text-sm text-primary">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
