"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui";
import { cn } from "@/shared/lib/cn";
import type { FoodExchange } from "../types";

interface FoodExchangeTableProps {
  exchanges: FoodExchange[];
}

const categoryLabels: Record<FoodExchange["category"], string> = {
  protein: "Proteinas",
  carbs: "Carbohidratos",
  fats: "Grasas",
  vegetables: "Vegetales",
};

const categoryColors: Record<FoodExchange["category"], string> = {
  protein: "bg-red-500/20 text-red-400 border-red-500/30",
  carbs: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  fats: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  vegetables: "bg-green-500/20 text-green-400 border-green-500/30",
};

export function FoodExchangeTable({ exchanges }: FoodExchangeTableProps) {
  const [activeCategory, setActiveCategory] = useState<FoodExchange["category"] | "all">("all");

  const categories: Array<FoodExchange["category"]> = ["protein", "carbs", "fats", "vegetables"];

  const filteredExchanges = activeCategory === "all"
    ? exchanges
    : exchanges.filter(e => e.category === activeCategory);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Tabla de Intercambios</CardTitle>
        <p className="text-sm text-foreground/60 mt-1">
          Puedes sustituir alimentos por otros de la misma categoria manteniendo los gramos equivalentes
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              activeCategory === "all"
                ? "bg-primary text-background"
                : "bg-card-hover text-foreground/60 hover:text-foreground"
            )}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
                activeCategory === cat
                  ? categoryColors[cat]
                  : "bg-card-hover text-foreground/60 hover:text-foreground border-transparent"
              )}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-foreground/60 font-medium">Alimento</th>
                <th className="text-left py-3 px-4 text-foreground/60 font-medium">Categoria</th>
                <th className="text-right py-3 px-4 text-foreground/60 font-medium">Gramos Equivalentes</th>
              </tr>
            </thead>
            <tbody>
              {filteredExchanges.map((exchange, index) => (
                <tr
                  key={`${exchange.category}-${index}`}
                  className="border-b border-border/50 hover:bg-card-hover transition-colors"
                >
                  <td className="py-3 px-4 font-medium">{exchange.name}</td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium border",
                      categoryColors[exchange.category]
                    )}>
                      {categoryLabels[exchange.category]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-primary font-mono">
                    {exchange.equivalentGrams}g
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
