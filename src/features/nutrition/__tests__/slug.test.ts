import { describe, it, expect } from "vitest";
import { foods } from "@/features/wizard/data/foods";
import {
  slugifyFoodName,
  foodsWithSlugs,
  getFoodBySlug,
  getPortionGrams,
} from "../slug";
import { generateStaticParams } from "@/app/nutricion/[alimento]/page";

describe("nutrition slugs", () => {
  it("slugifies names to url-safe lowercase", () => {
    expect(slugifyFoodName("Carne de Res")).toBe("carne-de-res");
    expect(slugifyFoodName("Mantequilla de Mani")).toBe("mantequilla-de-mani");
    expect(slugifyFoodName("Plátano")).toBe("platano");
  });

  it("roundtrips every food through slug -> getFoodBySlug", () => {
    for (const food of foods) {
      const slug = slugifyFoodName(food.name);
      const resolved = getFoodBySlug(slug);
      expect(resolved, `slug "${slug}" should resolve`).toBeDefined();
      expect(resolved!.id).toBe(food.id);
    }
  });

  it("produces unique slugs for all foods", () => {
    const slugs = foodsWithSlugs.map((f) => f.slug);
    expect(new Set(slugs).size).toBe(foods.length);
  });

  it("generateStaticParams covers every food exactly once", () => {
    const params = generateStaticParams();
    expect(params).toHaveLength(foods.length);
    const values = new Set(params.map((p) => p.alimento));
    expect(values.size).toBe(foods.length);
    for (const food of foodsWithSlugs) {
      expect(values.has(food.slug)).toBe(true);
    }
  });

  it("extracts portion grams from every food's portion string", () => {
    for (const food of foods) {
      expect(
        getPortionGrams(food.portion),
        `portion "${food.portion}" (${food.id})`,
      ).toBeGreaterThan(0);
    }
  });
});
