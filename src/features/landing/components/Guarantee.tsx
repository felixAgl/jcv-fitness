"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export function Guarantee() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-accent-cyan/10 to-accent-red/10 border border-accent-cyan/30 rounded-3xl p-8 md:p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-3xl md:text-4xl font-black mb-4">
            <span className="text-white">GARANTIA DE </span>
            <span className="text-accent-cyan">7 DIAS</span>
          </h2>

          <p className="text-xl text-gray-300 mb-6 max-w-2xl mx-auto">
            Tu riesgo es <span className="text-accent-cyan font-bold">CERO</span>. Si no estas
            satisfecho con tu plan personalizado, te devolvemos el 100% de tu dinero.{" "}
            <span className="text-white font-bold">Sin preguntas.</span>
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 text-green-400">
              <span className="text-lg">+</span>
              <span>Devolucion completa</span>
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <span className="text-lg">+</span>
              <span>Sin preguntas</span>
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <span className="text-lg">+</span>
              <span>Proceso simple</span>
            </div>
          </div>

          <Link
            href="/wizard"
            className="btn-cta inline-flex items-center justify-center gap-2 px-10 py-4 text-lg font-bold"
          >
            COMENZAR SIN RIESGO
          </Link>
        </div>
      </div>
    </section>
  );
}
