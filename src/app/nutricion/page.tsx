import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { foodsWithSlugs } from "@/features/nutrition/slug";
import { FoodSearchList } from "@/features/nutrition/components/FoodSearchList";

export const metadata: Metadata = {
  title: "Calorias y macros de alimentos | JCV Fitness",
  description:
    "Tabla de calorias, proteinas, carbohidratos y grasas de los alimentos mas comunes en Colombia: pollo, arroz, huevo, aguacate, platano y mas. Datos por 100g y por porcion.",
  openGraph: {
    title: "Calorias y macros de alimentos comunes",
    description:
      "Consulta calorias y macronutrientes de los alimentos mas comunes en Colombia, por 100g y por porcion.",
    type: "website",
    siteName: "JCV 24 Fitness",
  },
};

export default function NutricionIndexPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent-cyan transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Inicio
        </Link>

        <header className="mb-10">
          <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-foreground mb-3">
            Calorias y macros de <span className="gradient-text-cyan">alimentos</span>
          </h1>
          <p className="text-secondary max-w-2xl">
            Consulta las calorias, proteinas, carbohidratos y grasas de los
            alimentos mas comunes en la cocina colombiana. Datos por 100g y por
            porcion tipica.
          </p>
        </header>

        <FoodSearchList foods={foodsWithSlugs} />
      </div>
    </main>
  );
}
