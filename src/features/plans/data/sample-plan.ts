import type { UserPlan } from "../types";

/**
 * Sample plan data used for the public preview at /plan/view?preview=true
 * No auth required - this is a marketing demo showing what a generated plan looks like.
 */
export const SAMPLE_PLAN: UserPlan & { isExpired: boolean; daysRemaining: number } = {
  id: "preview-sample",
  userId: "preview",
  planType: "free",
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // +35 days
  isActive: true,
  downloadCount: 0,
  updatedAt: new Date(),
  isExpired: false,
  daysRemaining: 35,
  planData: {
    currentStep: 9,
    level: "intermedio",
    goal: "ganar_musculo",
    time: 60,
    equipment: ["gym_completo", "mancuernas", "barra", "banco"],
    duration: "6_semanas",
    selectedExercises: [
      // pecho
      "press_banca",
      "press_inclinado",
      "aperturas",
      "fondos_pecho",
      // espalda
      "dominadas",
      "remo_barra",
      "jalon_polea",
      "remo_mancuerna",
      // piernas
      "sentadilla",
      "peso_muerto",
      "zancadas",
      "prensa",
      "sentadilla_bulgara",
      "peso_muerto_rumano",
      "curl_femoral",
      "hip_thrust",
      "extension_pierna",
      // hombros
      "press_militar",
      "elevaciones_laterales",
      "elevaciones_frontales",
      "face_pull",
      // brazos
      "curl_bicep",
      "curl_martillo",
      "extension_tricep",
      "press_frances",
      // core
      "plancha",
      "crunch",
      "crunch_bicicleta",
    ],
    selectedFoods: [
      "pollo",
      "huevo",
      "arroz",
      "avena",
      "platano",
      "atun_lata",
      "carne_res",
      "papa",
      "pan_integral",
      "leche",
      "brocoli",
      "espinaca",
      "aguacate",
      "aceite_oliva",
      "mani",
    ],
    userName: "Ejemplo JCV",
    userBodyData: {
      currentWeight: 75,
      targetWeight: 80,
      height: 175,
      age: 28,
      gender: "masculino",
      activityLevel: "moderado",
      weightGoal: "ganar",
    },
  },
};
