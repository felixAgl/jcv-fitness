export interface TransformationImage {
  id: string;
  url: string;
  alt: string;
  type: "progress" | "promo" | "gym";
}

// JCV real photos from Instagram - saved locally
export const transformationImages: TransformationImage[] = [
  {
    id: "jcv-physique-1",
    url: "/images/transformations/result-1.jpg",
    alt: "JCV Fitness - Resultados reales",
    type: "progress",
  },
  {
    id: "jcv-physique-2",
    url: "/images/transformations/result-2.jpg",
    alt: "Entrena conmigo por 40 dias - Promocion JCV",
    type: "promo",
  },
  {
    id: "jcv-gym-1",
    url: "/images/transformations/result-1.jpg",
    alt: "JCV en el gym - Entrenamiento",
    type: "gym",
  },
  {
    id: "jcv-gym-2",
    url: "/images/transformations/result-2.jpg",
    alt: "JCV Fitness - Resultados de entrenamiento",
    type: "gym",
  },
];
