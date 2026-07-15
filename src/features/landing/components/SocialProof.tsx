"use client";

import { Star, Users, Download, Trophy } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "+500",
    label: "Usuarios activos",
  },
  {
    icon: Download,
    value: "+1,200",
    label: "Planes generados",
  },
  {
    icon: Trophy,
    value: "4.9",
    label: "Calificacion promedio",
  },
];

const testimonials = [
  {
    name: "Maria Garcia",
    date: "Enero 2025",
    rating: 5,
    text: "El plan de alimentacion es super completo. Me encanta que puedo ver las calorias de cada comida y el calendario me ayuda a no perder el ritmo.",
    avatar: "MG",
  },
  {
    name: "Carlos Rodriguez",
    date: "Diciembre 2024",
    rating: 5,
    text: "Las rutinas estan muy bien estructuradas. Los videos explicativos de cada ejercicio son un plus. Ya llevo 3 meses y los resultados se notan.",
    avatar: "CR",
  },
  {
    name: "Ana Martinez",
    date: "Enero 2025",
    rating: 5,
    text: "Lo mejor es que todo viene en PDF. Lo tengo en mi celular y puedo ver mi rutina en cualquier momento. Muy profesional.",
    avatar: "AM",
  },
];

export function SocialProof() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-card border border-gray-800 rounded-2xl p-8 text-center"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-accent-cyan/20 flex items-center justify-center">
                  <Icon className="w-7 h-7 text-accent-cyan" />
                </div>
                <div className="text-4xl font-black text-accent-cyan mb-2">{stat.value}</div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Testimonials */}
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4">
          <span className="text-white">Lo que dicen </span>
          <span className="text-accent-cyan">NUESTROS USUARIOS</span>
        </h2>
        <p className="text-xl text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          Personas reales con resultados reales
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="bg-card border border-gray-800 rounded-2xl p-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-accent-cyan to-blue-500 flex items-center justify-center text-white font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-bold text-white">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.date}</div>
                </div>
              </div>
              <div className="flex gap-1 mb-3">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-400 text-sm">{testimonial.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
