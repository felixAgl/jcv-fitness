import { Check, Crown, Zap } from "lucide-react";
import Link from "next/link";
import { buildWhatsAppUrl } from "@/features/landing/utils/whatsapp";

const subscriberFeatures: readonly string[] = [
  "Las 4 versiones completas",
  "Actualizaciones futuras gratis",
  "Soporte prioritario por WhatsApp",
  "Tutoriales en video exclusivos",
  "Acceso al plan de entrenamiento JCV",
  "Acceso al plan nutricional JCV",
] as const;

const oneTimeFeatures: readonly string[] = [
  "Las 4 versiones completas",
  "Actualizaciones futuras gratis",
  "Soporte por WhatsApp",
  "Tutorial de uso incluido",
] as const;

export function SpreadsheetPricing() {
  return (
    <section id="pricing" className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-black to-gray-950" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-black text-center mb-4">
          <span className="text-white">Elige tu </span>
          <span className="text-accent-cyan">PLAN</span>
        </h2>
        <p className="text-xl text-gray-400 text-center mb-16 max-w-2xl mx-auto">
          Gratis para suscriptores JCV Fitness. O comprala por separado.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Subscriber plan - highlighted */}
          <div className="relative rounded-2xl border-2 border-accent-cyan bg-gradient-to-b from-accent-cyan/10 to-transparent p-8">
            {/* Popular badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 px-4 py-1 bg-accent-cyan text-black text-sm font-bold rounded-full">
                <Crown className="w-4 h-4" />
                RECOMENDADO
              </span>
            </div>

            {/* Header */}
            <div className="text-center mb-8 mt-2">
              <h3 className="text-2xl font-bold text-white mb-2">
                Suscriptor JCV Fitness
              </h3>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-black text-accent-cyan">GRATIS</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Incluido con tu suscripcion activa
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {subscriberFeatures.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-3 text-gray-300"
                >
                  <div className="w-5 h-5 rounded-full bg-accent-cyan/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-accent-cyan" />
                  </div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link
              href="/wizard"
              className="block w-full text-center py-4 rounded-xl bg-accent-cyan text-black font-bold text-lg hover:bg-accent-cyan/90 transition-colors"
            >
              Suscribirme ahora
            </Link>
          </div>

          {/* One-time purchase */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">
                Compra unica
              </h3>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-2xl text-gray-500 line-through">
                  $49.900
                </span>
                <span className="text-5xl font-black text-white">$29.900</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                COP - Pago unico, tuya para siempre
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {oneTimeFeatures.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-3 text-gray-300"
                >
                  <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-gray-400" />
                  </div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <a
              href={buildWhatsAppUrl("Hola, quiero comprar la hoja de evaluacion fisica")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full text-center py-4 rounded-xl border border-gray-600 text-white font-bold text-lg hover:border-accent-cyan/50 hover:bg-gray-800 transition-all"
            >
              <Zap className="w-5 h-5" />
              Comprar ahora
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
