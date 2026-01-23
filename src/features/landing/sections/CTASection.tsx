"use client";

import { Button } from "@/shared/components/ui";
import { ArrowRight, MessageCircle } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-r from-primary/20 via-card to-accent/20">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Listo para comenzar tu <span className="text-primary">transformacion</span>?
        </h2>
        <p className="text-xl text-foreground/70 mb-8 max-w-2xl mx-auto">
          No dejes pasar mas tiempo. Tu mejor version te esta esperando.
          Comienza hoy con JCV Fitness.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="gap-2">
            <a href="#pricing" className="flex items-center gap-2">
              Comenzar ahora
              <ArrowRight className="h-5 w-5" />
            </a>
          </Button>
          <Button variant="outline" size="lg" className="gap-2">
            <MessageCircle className="h-5 w-5" />
            <a
              href="https://wa.me/573001234567?text=Hola,%20quiero%20informacion%20sobre%20JCV%20Fitness"
              target="_blank"
              rel="noopener noreferrer"
            >
              Escribenos por WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
