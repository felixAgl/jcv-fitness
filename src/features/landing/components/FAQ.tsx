"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Como funciona el plan personalizado?",
    answer:
      "Completas un wizard de 6 preguntas sobre tu objetivo (perder grasa, ganar musculo, etc), tu nivel de experiencia, dias disponibles para entrenar, y preferencias alimenticias. Con esa informacion, generamos un plan de alimentacion y ejercicios 100% adaptado a ti.",
  },
  {
    question: "Que incluye el PDF que descargo?",
    answer:
      "El PDF incluye: tu plan de alimentacion con 5 comidas diarias y macros detallados, tu rutina de ejercicios con series, repeticiones y descansos, un calendario semanal con checkboxes para marcar tu progreso, y recomendaciones personalizadas segun tu objetivo.",
  },
  {
    question: "Puedo usar el plan en mi celular?",
    answer:
      "Si. El PDF es compatible con cualquier dispositivo. Ademas, desde tu dashboard puedes ver tu plan de alimentacion y ejercicios de forma interactiva, con videos de cada ejercicio.",
  },
  {
    question: "Que pasa si tengo restricciones alimenticias?",
    answer:
      "En el wizard puedes indicar si eres vegetariano, vegano, o tienes alergias. El plan se ajusta automaticamente para excluir esos alimentos y sugerirte alternativas.",
  },
  {
    question: "Cuanto tiempo dura la suscripcion?",
    answer:
      "Ofrecemos planes mensuales, trimestrales y anuales. Puedes cancelar en cualquier momento desde tu dashboard. Mientras tu suscripcion este activa, tienes acceso a tu plan, dashboard, y puedes regenerar tu plan si cambias de objetivo.",
  },
  {
    question: "Puedo cambiar mi plan si no me gusta?",
    answer:
      "Si. Puedes volver a completar el wizard y regenerar tu plan cuantas veces quieras mientras tu suscripcion este activa. Esto es util si cambias de objetivo o quieres probar una rutina diferente.",
  },
  {
    question: "Como me contacto si tengo dudas?",
    answer:
      "Puedes escribirnos por WhatsApp o email. Respondemos en menos de 24 horas. El link de contacto esta en el footer de la pagina.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-background-light">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4">
          <span className="text-white">Preguntas </span>
          <span className="text-accent-cyan">FRECUENTES</span>
        </h2>
        <p className="text-xl text-gray-400 text-center mb-12">
          Todo lo que necesitas saber antes de empezar
        </p>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-card border border-gray-800 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors"
              >
                <span className="font-bold text-white pr-4">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-accent-cyan flex-shrink-0 transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-400">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
