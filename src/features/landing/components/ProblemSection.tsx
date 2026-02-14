"use client";

import { FileX, Sparkles } from "lucide-react";

export function ProblemSection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-background-light">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4">
          <span className="text-white">No basta con </span>
          <span className="text-accent-cyan">QUERER</span>
          <span className="text-white"> cambiar...</span>
        </h2>
        <p className="text-xl text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          Sin un plan estructurado, terminas perdiendo tiempo y motivacion
        </p>

        <div className="grid md:grid-cols-3 gap-8 items-center">
          {/* Before */}
          <div className="bg-card border border-red-500/30 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <FileX className="w-10 h-10 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-red-400 mb-4">Sin Plan</h3>
            <ul className="text-gray-400 space-y-2 text-left">
              <li className="flex items-start gap-2">
                <span className="text-red-400">x</span>
                <span>Dietas genericas de internet</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">x</span>
                <span>Rutinas que no van con tu nivel</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">x</span>
                <span>Sin seguimiento ni calendario</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">x</span>
                <span>Abandonas en 2 semanas</span>
              </li>
            </ul>
          </div>

          {/* VS */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-accent-cyan to-accent-red flex items-center justify-center animate-pulse">
                <span className="text-2xl font-black text-white">VS</span>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-accent-cyan/20 to-accent-red/20 rounded-full blur-xl -z-10" />
            </div>
          </div>

          {/* After */}
          <div className="bg-card border border-accent-cyan/30 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent-cyan/20 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-accent-cyan" />
            </div>
            <h3 className="text-xl font-bold text-accent-cyan mb-4">Con JCV Fitness</h3>
            <ul className="text-gray-400 space-y-2 text-left">
              <li className="flex items-start gap-2">
                <span className="text-green-400">+</span>
                <span>Plan 100% personalizado</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">+</span>
                <span>Adaptado a TU nivel y objetivo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">+</span>
                <span>Calendario con checkboxes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">+</span>
                <span>PDF profesional descargable</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
