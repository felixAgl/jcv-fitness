"use client";

import Link from "next/link";
import { useSubscription } from "@/features/subscription";

export function QuickActions() {
  const { hasActiveSubscription } = useSubscription();

  const actions = [
    {
      title: "Mi Plan Alimenticio",
      description: "Ver tu plan de comidas personalizado",
      href: "/plan/alimentacion",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      color: "cyan",
      requiresSubscription: true,
    },
    {
      title: "Mi Rutina",
      description: "Accede a tus ejercicios diarios",
      href: "/plan/ejercicios",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: "purple",
      requiresSubscription: true,
    },
    {
      title: "Descargar PDF",
      description: "Descarga tu plan completo",
      href: "/plan/download",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "green",
      requiresSubscription: true,
    },
    {
      title: "Contactar Soporte",
      description: "Habla con un asesor",
      href: "https://wa.me/573001234567",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      color: "green",
      requiresSubscription: false,
      external: true,
    },
  ];

  const colorClasses = {
    cyan: {
      bg: "bg-accent-cyan/10",
      text: "text-accent-cyan",
      hover: "hover:border-accent-cyan/50",
    },
    purple: {
      bg: "bg-purple-500/10",
      text: "text-purple-400",
      hover: "hover:border-purple-500/50",
    },
    green: {
      bg: "bg-green-500/10",
      text: "text-green-400",
      hover: "hover:border-green-500/50",
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {actions.map((action) => {
        const isDisabled = action.requiresSubscription && !hasActiveSubscription;
        const colors = colorClasses[action.color as keyof typeof colorClasses];

        const content = (
          <div
            className={`bg-gray-900 rounded-xl border border-gray-800 p-4 transition-all ${
              isDisabled ? "opacity-50 cursor-not-allowed" : colors.hover
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <span className={colors.text}>{action.icon}</span>
              </div>
              <div>
                <h4 className="text-white font-semibold">{action.title}</h4>
                <p className="text-gray-400 text-sm">{action.description}</p>
                {isDisabled && (
                  <span className="text-xs text-orange-400 mt-1 block">
                    Requiere suscripcion activa
                  </span>
                )}
              </div>
            </div>
          </div>
        );

        if (isDisabled) {
          return <div key={action.title}>{content}</div>;
        }

        if (action.external) {
          return (
            <a
              key={action.title}
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {content}
            </a>
          );
        }

        return (
          <Link key={action.title} href={action.href}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}
