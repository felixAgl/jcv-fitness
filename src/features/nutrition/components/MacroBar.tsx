import type { Food } from "@/features/wizard/data/foods";
import { getMacroCalorieSplit } from "../slug";

/**
 * Pure-CSS horizontal bar showing the calorie split between macros.
 * Server component — no interactivity.
 */
export function MacroBar({ food }: { food: Food }) {
  const split = getMacroCalorieSplit(food);

  const segments = [
    { label: "Proteina", pct: split.protein, barClass: "bg-macro-protein", textClass: "text-macro-protein" },
    { label: "Carbohidratos", pct: split.carbs, barClass: "bg-macro-carbs", textClass: "text-macro-carbs" },
    { label: "Grasa", pct: split.fat, barClass: "bg-macro-fat", textClass: "text-macro-fat" },
  ];

  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-card-hover border border-border">
        {segments.map(
          (seg) =>
            seg.pct > 0 && (
              <div
                key={seg.label}
                className={seg.barClass}
                style={{ width: `${seg.pct}%` }}
                aria-hidden
              />
            ),
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${seg.barClass}`} />
            <span className="text-secondary">{seg.label}</span>
            <span className={`font-semibold ${seg.textClass}`}>{seg.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
