import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { FOOD_TRANSLATIONS } from "@/features/wizard/data/foods";
import {
  foodsWithSlugs,
  getFoodBySlug,
  getSimilarFoods,
  getPortionGrams,
  perPortion,
} from "@/features/nutrition/slug";
import { MacroBar } from "@/features/nutrition/components/MacroBar";

interface PageProps {
  params: Promise<{ alimento: string }>;
}

export function generateStaticParams() {
  return foodsWithSlugs.map((food) => ({ alimento: food.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { alimento } = await params;
  const food = getFoodBySlug(alimento);
  if (!food) return {};

  const description = `${food.name}: ${food.calories} calorias, ${food.protein}g de proteina, ${food.carbs}g de carbohidratos y ${food.fat}g de grasa por 100g. Tabla nutricional completa, porcion recomendada y alimentos similares.`;

  return {
    title: `Calorias de ${food.name} | JCV Fitness`,
    description,
    openGraph: {
      title: `Calorias y macros de ${food.name}`,
      description,
      type: "article",
      siteName: "JCV 24 Fitness",
    },
  };
}

export default async function FoodPage({ params }: PageProps) {
  const { alimento } = await params;
  const food = getFoodBySlug(alimento);
  if (!food) notFound();

  const similar = getSimilarFoods(food, 4);
  const portionGrams = getPortionGrams(food.portion);

  const rows = [
    { label: "Calorias", per100: `${food.calories} kcal`, perPortionValue: portionGrams ? `${Math.round(perPortion(food.calories, portionGrams))} kcal` : null },
    { label: "Proteina", per100: `${food.protein} g`, perPortionValue: portionGrams ? `${perPortion(food.protein, portionGrams)} g` : null },
    { label: "Carbohidratos", per100: `${food.carbs} g`, perPortionValue: portionGrams ? `${perPortion(food.carbs, portionGrams)} g` : null },
    { label: "Grasa", per100: `${food.fat} g`, perPortionValue: portionGrams ? `${perPortion(food.fat, portionGrams)} g` : null },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NutritionInformation",
    calories: `${food.calories} calories`,
    proteinContent: `${food.protein} g`,
    carbohydrateContent: `${food.carbs} g`,
    fatContent: `${food.fat} g`,
    servingSize: "100 g",
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-3xl">
        <Link
          href="/nutricion"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent-cyan transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Todos los alimentos
        </Link>

        {/* Hero */}
        <header className="mb-10">
          <div className="flex items-start gap-4">
            <span className="text-6xl leading-none" aria-hidden>
              {food.emoji}
            </span>
            <div>
              <p className="text-sm uppercase tracking-widest text-accent-cyan mb-1">
                {FOOD_TRANSLATIONS[food.category]}
              </p>
              <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-foreground">
                Calorias y macros de {food.name}
              </h1>
              <p className="mt-2 text-secondary">{food.altName}</p>
            </div>
          </div>

          <div className="mt-8 wash-cyan rounded-2xl border border-border p-6 flex items-baseline gap-3">
            <span className="font-display text-7xl tracking-wide gradient-text-cyan leading-none">
              {food.calories}
            </span>
            <span className="text-muted text-lg">kcal por 100g</span>
          </div>
        </header>

        {/* Nutrition table */}
        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-wide text-foreground mb-4">
            Informacion nutricional
          </h2>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left">
              <thead className="bg-card-hover text-sm text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Nutriente</th>
                  <th className="px-4 py-3 font-medium">Por 100g</th>
                  {portionGrams && (
                    <th className="px-4 py-3 font-medium">
                      Por porcion · {food.portion}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.label}>
                    <td className="px-4 py-3 text-secondary">{row.label}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{row.per100}</td>
                    {portionGrams && (
                      <td className="px-4 py-3 text-secondary">{row.perPortionValue}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Macro split bar */}
        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-wide text-foreground mb-4">
            Distribucion de macros
          </h2>
          <div className="rounded-xl border border-border bg-card p-6">
            <MacroBar food={food} />
          </div>
        </section>

        {/* Benefits */}
        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-wide text-foreground mb-4">
            Beneficios
          </h2>
          <p className="text-secondary leading-relaxed">{food.benefits}</p>
          <p className="mt-2 text-sm text-muted">{food.techName}</p>
        </section>

        {/* Similar foods */}
        {similar.length > 0 && (
          <section className="mb-12">
            <h2 className="font-display text-2xl tracking-wide text-foreground mb-4">
              Alimentos similares
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {similar.map((s) => (
                <Link
                  key={s.id}
                  href={`/nutricion/${s.slug}`}
                  className="hover-lift flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-accent-cyan/50"
                >
                  <span className="text-2xl" aria-hidden>
                    {s.emoji}
                  </span>
                  <div>
                    <div className="font-semibold text-foreground">{s.name}</div>
                    <div className="text-sm text-muted">{s.calories} kcal / 100g</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="rounded-2xl border border-accent-cyan/30 bg-card p-8 text-center glow-cyan-soft">
          <h2 className="font-display text-3xl tracking-wide text-foreground mb-3">
            Convierte estas calorias en un plan de 40 dias
          </h2>
          <p className="text-secondary mb-6 max-w-xl mx-auto">
            Genera un plan de alimentacion y entrenamiento personalizado con los
            alimentos que ya tienes en casa.
          </p>
          <Link
            href="/wizard"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-8 py-3 font-display text-xl tracking-wider text-black hover:opacity-90 transition-opacity"
          >
            Crear mi plan
            <ArrowRight className="w-5 h-5" />
          </Link>
        </section>
      </div>
    </main>
  );
}
