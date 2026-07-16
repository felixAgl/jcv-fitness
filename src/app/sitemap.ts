import type { MetadataRoute } from "next";
import { foodsWithSlugs } from "@/features/nutrition/slug";

// Required for output: "export" — the sitemap is generated at build time.
export const dynamic = "force-static";

const BASE_URL = "https://jcv24fitness.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/wizard`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/spreadsheet`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/agenda`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/videos`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/nutricion`, changeFrequency: "monthly", priority: 0.8 },
  ];

  const foodRoutes: MetadataRoute.Sitemap = foodsWithSlugs.map((food) => ({
    url: `${BASE_URL}/nutricion/${food.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...foodRoutes];
}
