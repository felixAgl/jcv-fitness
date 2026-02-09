// Video tutorials data - BowFlex channel examples
// TODO: Replace with JCV Fitness custom videos when available

export interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  duration: string;
  category: "ejercicios" | "nutricion" | "tecnica";
  isPremium: boolean;
  channel: string;
}

export const VIDEO_TUTORIALS: VideoTutorial[] = [
  // Free videos
  {
    id: "1",
    title: "10 Min Full Body Stretch",
    description: "Rutina de estiramiento completo para antes o despues del entreno",
    youtubeId: "QOVaHwm-Q6U",
    duration: "10:05",
    category: "ejercicios",
    isPremium: false,
    channel: "BowFlex",
  },
  {
    id: "2",
    title: "15 Min Low Impact Cardio",
    description: "Cardio de bajo impacto perfecto para principiantes",
    youtubeId: "VHyGqsPOUHs",
    duration: "15:00",
    category: "ejercicios",
    isPremium: false,
    channel: "BowFlex",
  },
  {
    id: "3",
    title: "10 Min Standing Abs",
    description: "Ejercicios de abdominales de pie, sin necesidad de suelo",
    youtubeId: "7PwNRG9wL9s",
    duration: "10:00",
    category: "tecnica",
    isPremium: false,
    channel: "BowFlex",
  },
  // Premium videos
  {
    id: "4",
    title: "30 Min Full Body Strength",
    description: "Rutina completa de fuerza para todo el cuerpo",
    youtubeId: "UItWltVZZmE",
    duration: "30:00",
    category: "ejercicios",
    isPremium: true,
    channel: "BowFlex",
  },
  {
    id: "5",
    title: "20 Min Upper Body Workout",
    description: "Entrena pecho, espalda, hombros y brazos",
    youtubeId: "xJykPvqmCvE",
    duration: "20:00",
    category: "ejercicios",
    isPremium: true,
    channel: "BowFlex",
  },
  {
    id: "6",
    title: "25 Min Lower Body Burn",
    description: "Piernas y gluteos intensos para resultados rapidos",
    youtubeId: "Fw4Op91K8ug",
    duration: "25:00",
    category: "ejercicios",
    isPremium: true,
    channel: "BowFlex",
  },
  {
    id: "7",
    title: "HIIT Training 20 Min",
    description: "Entrenamiento de alta intensidad para quemar grasa",
    youtubeId: "M0uO8X3_tEA",
    duration: "20:00",
    category: "tecnica",
    isPremium: true,
    channel: "BowFlex",
  },
  {
    id: "8",
    title: "Core Strength Fundamentals",
    description: "Fundamentos de fuerza del core para estabilidad",
    youtubeId: "DHvSGdCIZyQ",
    duration: "15:00",
    category: "tecnica",
    isPremium: true,
    channel: "BowFlex",
  },
];

export const getYoutubeThumbnail = (youtubeId: string): string => {
  return `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
};

export const getYoutubeUrl = (youtubeId: string): string => {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
};
