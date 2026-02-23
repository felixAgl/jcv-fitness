export interface TransformationImage {
  id: string;
  url: string;
  alt: string;
  type: "progress" | "promo" | "gym";
}

// JCV real photos from Instagram - saved locally
export const transformationImages: TransformationImage[] = [
  {
    id: "camilo-before",
    url: "/images/transformations/camilo-before.jpg",
    alt: "Camilo - Inicio del proceso de transformacion",
    type: "progress",
  },
  {
    id: "camilo-after",
    url: "/images/transformations/camilo-after.jpg",
    alt: "Camilo - Resultado despues del entrenamiento con JCV",
    type: "progress",
  },
  {
    id: "jcv-physique-1",
    url: "/images/transformations/result-2.jpg",
    alt: "JCV Fitness - Resultados reales",
    type: "progress",
  },
  {
    id: "jcv-physique-2",
    url: "/images/transformations/result-3.jpg",
    alt: "JCV Fitness - Definicion muscular",
    type: "progress",
  },
];
