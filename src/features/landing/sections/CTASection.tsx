"use client";

import Image from "next/image";
import { Button } from "@/shared/components/ui";
import { ArrowRight, MessageCircle } from "lucide-react";
import { transformationImages } from "../data/transformations";
import { JCVLogo } from "@/shared/components/JCVLogo";

export function CTASection() {
  const promoImage = transformationImages[1]; // promo-40dias

  return (
    <section className="py-20 px-4 bg-gradient-to-r from-primary/20 via-card to-accent/20 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <Image
          src={promoImage.url}
          alt=""
          fill
          className="object-cover blur-sm"
          unoptimized
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Listo para comenzar tu <span className="text-primary">transformacion</span>?
            </h2>
            <p className="text-xl text-foreground/70 mb-8">
              No dejes pasar mas tiempo. Tu mejor version te esta esperando.
              Comienza hoy con <span className="inline-flex items-center gap-1"><JCVLogo variant="cyan" size="sm" showText={false} /></span> JCV 24 Fitness.
            </p>
            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
              <Button size="lg" className="gap-2">
                <a href="#pricing" className="flex items-center gap-2">
                  Comenzar ahora
                  <ArrowRight className="h-5 w-5" />
                </a>
              </Button>
              <Button variant="outline" size="lg" className="gap-2">
                <MessageCircle className="h-5 w-5" />
                <a
                  href="https://wa.me/573143826430?text=Hola,%20quiero%20informacion%20sobre%20JCV%20Fitness"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
              </Button>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative aspect-square max-w-sm mx-auto">
              <div className="absolute inset-4 rounded-full bg-accent-cyan/20 blur-3xl" />
              <div className="relative w-full h-full rounded-2xl overflow-hidden border-4 border-accent-cyan/30 shadow-2xl shadow-accent-cyan/20">
                <Image
                  src={promoImage.url}
                  alt={promoImage.alt}
                  fill
                  className="object-cover"
                  sizes="400px"
                  unoptimized
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-accent-red text-white px-6 py-3 rounded-xl font-bold shadow-lg transform rotate-3">
                JCV 24
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
