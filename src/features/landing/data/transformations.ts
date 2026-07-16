/**
 * Transformation gallery data.
 *
 * TRAINER: to add or update real client results, edit ONLY this file.
 * - `personName`: real first name of the client (leave undefined if unknown).
 * - `result`: short real outcome line in both languages. Never invent numbers
 *   (kg, %) — only write what the client actually achieved.
 * - `quote`: optional short literal quote from the client.
 * Slides without `personName` fall back to the generic alt caption.
 */
export interface TransformationImage {
  id: string;
  url: string;
  alt: string;
  type: "progress" | "promo" | "gym";
  /** Real name shown bold on the slide caption bar. */
  personName?: string;
  /** Real result line (no invented numbers), per language. */
  result?: { es: string; en: string };
  /** Optional literal quote from the client, per language. */
  quote?: { es: string; en: string };
}

// JCV real photos from Instagram - saved locally
export const transformationImages: TransformationImage[] = [
  {
    id: "camilo-before",
    url: "/images/transformations/camilo-before.jpg",
    alt: "Camilo - Inicio del proceso de transformacion",
    type: "progress",
    personName: "Camilo",
    result: { es: "Transformacion en 40 dias", en: "40-day transformation" },
  },
  {
    id: "camilo-after",
    url: "/images/transformations/camilo-after.jpg",
    alt: "Camilo - Resultado despues del entrenamiento con JCV",
    type: "progress",
    personName: "Camilo",
    result: { es: "Transformacion en 40 dias", en: "40-day transformation" },
  },
  {
    id: "jcv-physique-1",
    url: "/images/transformations/result-2.jpg",
    alt: "JCV Fitness - Resultados reales",
    type: "progress",
    personName: "JCV",
    result: { es: "Entrenador", en: "Trainer" },
  },
  {
    id: "jcv-physique-2",
    url: "/images/transformations/result-3.jpg",
    alt: "JCV Fitness - Definicion muscular",
    type: "progress",
    personName: "JCV",
    result: { es: "Entrenador", en: "Trainer" },
  },
];
