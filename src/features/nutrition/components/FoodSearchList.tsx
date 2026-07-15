"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { FOOD_TRANSLATIONS, type FoodCategory } from "@/features/wizard/data/foods";
import type { FoodWithSlug } from "../slug";

const CATEGORY_ORDER: FoodCategory[] = [
  "proteinas",
  "carbohidratos",
  "grasas",
  "vegetales",
  "frutas",
  "lacteos",
];

interface FoodSearchListProps {
  foods: FoodWithSlug[];
}

/**
 * Small client island: search box + category-grouped links to every
 * /nutricion/[alimento] page.
 */
export function FoodSearchList({ foods }: FoodSearchListProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return foods;
    return foods.filter(
      (food) =>
        food.name.toLowerCase().includes(q) ||
        food.altName.toLowerCase().includes(q),
    );
  }, [foods, query]);

  return (
    <div>
      <div className="relative mb-10 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca un alimento (pollo, arroz, aguacate...)"
          aria-label="Buscar alimento"
          className="w-full rounded-full border border-border bg-card py-3 pl-12 pr-5 text-foreground placeholder:text-muted focus:border-accent-cyan focus:outline-none focus:ring-1 focus:ring-accent-cyan transition-colors"
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-muted">No encontramos alimentos con ese nombre.</p>
      )}

      <div className="space-y-12">
        {CATEGORY_ORDER.map((category) => {
          const items = filtered.filter((food) => food.category === category);
          if (items.length === 0) return null;
          return (
            <section key={category}>
              <h2 className="font-display text-2xl tracking-wide text-accent-cyan mb-4">
                {FOOD_TRANSLATIONS[category]}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((food) => (
                  <Link
                    key={food.id}
                    href={`/nutricion/${food.slug}`}
                    className="hover-lift flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-accent-cyan/50"
                  >
                    <span className="text-3xl" aria-hidden>
                      {food.emoji}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground">{food.name}</div>
                      <div className="text-sm text-muted truncate">
                        {food.calories} kcal · P {food.protein}g · C {food.carbs}g · G {food.fat}g
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
