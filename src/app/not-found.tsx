import Link from "next/link";
import { NotFound } from "@/shared/components/illustrations";

export const metadata = {
  title: "Pagina no encontrada | JCV 24 Fitness",
};

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <NotFound
          title="Ruta sin salida"
          className="w-40 h-40 sm:w-48 sm:h-48 mx-auto mb-8"
        />

        <p className="text-accent-cyan text-xs uppercase tracking-[0.3em] mb-3">
          Error 404
        </p>
        <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-white mb-4">
          Esta ruta no existe
        </h1>
        <p className="text-gray-400 mb-8">
          La pagina que buscas se movio o nunca estuvo aqui. Volvamos al camino.
        </p>

        <div className="grid gap-3">
          <Link
            href="/"
            className="px-8 py-4 rounded-xl font-bold bg-accent-cyan text-black hover:shadow-lg hover:shadow-accent-cyan/50 transition-all"
          >
            Volver al inicio
          </Link>
          <Link
            href="/wizard"
            className="px-6 py-3 rounded-lg font-semibold border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white transition-all"
          >
            Crear mi plan
          </Link>
        </div>
      </div>
    </main>
  );
}
