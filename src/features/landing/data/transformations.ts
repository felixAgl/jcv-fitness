export interface TransformationImage {
  id: string;
  url: string;
  alt: string;
  type: "progress" | "promo" | "gym";
}

// Placeholder images until real JCV photos are uploaded to /public/images/transformations/
// To use real photos: download from Instagram, save to public/images/transformations/, update URLs
export const transformationImages: TransformationImage[] = [
  {
    id: "physique-1",
    url: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&h=1000&fit=crop",
    alt: "JCV Fitness - Resultados reales",
    type: "progress",
  },
  {
    id: "promo-40dias",
    url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=1000&fit=crop",
    alt: "Entrena conmigo por 40 dias - Promocion JCV",
    type: "promo",
  },
  {
    id: "gym-selfie",
    url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=1000&fit=crop",
    alt: "JCV en el gym - Entrenamiento",
    type: "gym",
  },
  {
    id: "gym-pose-1",
    url: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&h=1000&fit=crop",
    alt: "JCV Fitness - Resultados de entrenamiento",
    type: "gym",
  },
];
