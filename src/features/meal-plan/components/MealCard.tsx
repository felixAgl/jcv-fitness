"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui";
import { Clock, Utensils } from "lucide-react";
import type { Meal } from "../types";

interface MealCardProps {
  meal: Meal;
}

export function MealCard({ meal }: MealCardProps) {
  return (
    <Card hover className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg text-primary">{meal.name}</CardTitle>
        <div className="flex items-center gap-1 text-sm text-foreground/60">
          <Clock className="h-4 w-4" />
          <span>{meal.time}</span>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {meal.foods.map((food, index) => (
            <li key={index} className="flex items-start gap-2">
              <Utensils className="h-4 w-4 mt-0.5 text-primary/60 shrink-0" />
              <span className="text-sm">
                <span className="font-medium">{food.name}</span>
                <span className="text-foreground/60 ml-1">
                  {food.unit ?? `${food.grams}g`}
                </span>
              </span>
            </li>
          ))}
        </ul>
        {meal.notes && (
          <p className="mt-4 text-xs text-foreground/50 italic border-t border-border pt-3">
            {meal.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
