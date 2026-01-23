import type { WeightGoal, MealPlanDay, MealFood } from "../types";

// Alimentos comunes en Colombia/Latinoamerica con macros
const FOODS: Record<string, MealFood> = {
  // Proteinas
  huevos_enteros: { name: "Huevos enteros", portion: "2 unidades", calories: 140, protein: 12, carbs: 1, fat: 10 },
  claras_huevo: { name: "Claras de huevo", portion: "4 unidades", calories: 68, protein: 14, carbs: 1, fat: 0 },
  pollo_pechuga: { name: "Pechuga de pollo", portion: "150g", calories: 165, protein: 31, carbs: 0, fat: 4 },
  carne_res_magra: { name: "Carne de res magra", portion: "150g", calories: 210, protein: 26, carbs: 0, fat: 11 },
  pescado_tilapia: { name: "Tilapia/Mojarra", portion: "150g", calories: 145, protein: 30, carbs: 0, fat: 3 },
  atun_agua: { name: "Atun en agua", portion: "1 lata (170g)", calories: 150, protein: 33, carbs: 0, fat: 1 },
  salmon: { name: "Salmon", portion: "150g", calories: 280, protein: 30, carbs: 0, fat: 17 },
  proteina_whey: { name: "Proteina Whey", portion: "1 scoop (30g)", calories: 120, protein: 24, carbs: 3, fat: 1 },

  // Carbohidratos
  arroz_integral: { name: "Arroz integral", portion: "1 taza cocido", calories: 218, protein: 5, carbs: 45, fat: 2 },
  arroz_blanco: { name: "Arroz blanco", portion: "1 taza cocido", calories: 205, protein: 4, carbs: 45, fat: 0 },
  avena: { name: "Avena en hojuelas", portion: "1/2 taza (40g)", calories: 150, protein: 5, carbs: 27, fat: 3 },
  papa: { name: "Papa cocida", portion: "1 mediana (150g)", calories: 130, protein: 3, carbs: 30, fat: 0 },
  platano: { name: "Platano verde/maduro", portion: "1 unidad", calories: 122, protein: 1, carbs: 32, fat: 0 },
  yuca: { name: "Yuca cocida", portion: "100g", calories: 160, protein: 1, carbs: 38, fat: 0 },
  pan_integral: { name: "Pan integral", portion: "2 rebanadas", calories: 160, protein: 8, carbs: 28, fat: 2 },
  arepa: { name: "Arepa de maiz", portion: "1 unidad (80g)", calories: 150, protein: 3, carbs: 28, fat: 3 },
  batata: { name: "Batata/Camote", portion: "150g", calories: 130, protein: 2, carbs: 30, fat: 0 },
  quinoa: { name: "Quinoa cocida", portion: "1 taza", calories: 222, protein: 8, carbs: 39, fat: 4 },

  // Grasas saludables
  aguacate: { name: "Aguacate", portion: "1/2 unidad", calories: 120, protein: 1, carbs: 6, fat: 11 },
  aceite_oliva: { name: "Aceite de oliva", portion: "1 cucharada", calories: 120, protein: 0, carbs: 0, fat: 14 },
  almendras: { name: "Almendras", portion: "15 unidades (23g)", calories: 130, protein: 5, carbs: 4, fat: 11 },
  mani: { name: "Mani natural", portion: "30g", calories: 170, protein: 7, carbs: 5, fat: 14 },
  mantequilla_mani: { name: "Mantequilla de mani", portion: "2 cucharadas", calories: 190, protein: 8, carbs: 6, fat: 16 },

  // Vegetales
  ensalada_mixta: { name: "Ensalada mixta", portion: "1 plato", calories: 35, protein: 2, carbs: 7, fat: 0 },
  brocoli: { name: "Brocoli", portion: "1 taza", calories: 55, protein: 4, carbs: 11, fat: 0 },
  espinaca: { name: "Espinaca", portion: "2 tazas", calories: 14, protein: 2, carbs: 2, fat: 0 },
  tomate: { name: "Tomate", portion: "1 mediano", calories: 22, protein: 1, carbs: 5, fat: 0 },
  zanahoria: { name: "Zanahoria", portion: "1 mediana", calories: 25, protein: 1, carbs: 6, fat: 0 },
  pepino: { name: "Pepino", portion: "1 taza", calories: 16, protein: 1, carbs: 4, fat: 0 },

  // Frutas
  banano: { name: "Banano", portion: "1 mediano", calories: 105, protein: 1, carbs: 27, fat: 0 },
  manzana: { name: "Manzana", portion: "1 mediana", calories: 95, protein: 0, carbs: 25, fat: 0 },
  fresas: { name: "Fresas", portion: "1 taza", calories: 50, protein: 1, carbs: 12, fat: 0 },
  papaya: { name: "Papaya", portion: "1 taza", calories: 55, protein: 1, carbs: 14, fat: 0 },
  mango: { name: "Mango", portion: "1 taza", calories: 100, protein: 1, carbs: 25, fat: 0 },

  // Lacteos
  leche_descremada: { name: "Leche descremada", portion: "1 vaso (240ml)", calories: 90, protein: 8, carbs: 12, fat: 0 },
  yogurt_griego: { name: "Yogurt griego", portion: "170g", calories: 100, protein: 17, carbs: 6, fat: 1 },
  queso_cottage: { name: "Queso cottage", portion: "1/2 taza", calories: 110, protein: 14, carbs: 5, fat: 5 },
  queso_campesino: { name: "Queso campesino", portion: "30g", calories: 70, protein: 5, carbs: 1, fat: 5 },
};

// Generar plan de alimentacion basado en calorias objetivo
export function generateMealPlan(
  targetCalories: number,
  weightGoal: WeightGoal,
  days: number = 7
): MealPlanDay[] {
  const mealPlans: MealPlanDay[] = [];

  // Distribucion de macros segun objetivo
  const macroRatios = getMacroRatios(weightGoal);

  for (let day = 1; day <= days; day++) {
    const dayPlan = generateDayPlan(targetCalories, macroRatios, day);
    mealPlans.push(dayPlan);
  }

  return mealPlans;
}

function getMacroRatios(goal: WeightGoal): { protein: number; carbs: number; fat: number } {
  switch (goal) {
    case "perder":
      return { protein: 0.40, carbs: 0.30, fat: 0.30 }; // Alto en proteina para preservar musculo
    case "ganar":
      return { protein: 0.30, carbs: 0.45, fat: 0.25 }; // Mas carbos para energia
    case "mantener":
    default:
      return { protein: 0.30, carbs: 0.40, fat: 0.30 }; // Balanceado
  }
}

function generateDayPlan(
  targetCalories: number,
  _macroRatios: { protein: number; carbs: number; fat: number },
  dayNumber: number
): MealPlanDay {
  // Distribucion de calorias por comida
  const mealDistribution = {
    desayuno: 0.25,
    snack_am: 0.10,
    almuerzo: 0.30,
    snack_pm: 0.10,
    cena: 0.25,
  };

  const meals = [
    {
      name: "Desayuno",
      time: "7:00 AM",
      targetCals: targetCalories * mealDistribution.desayuno,
      template: getBreakfastTemplate(dayNumber),
    },
    {
      name: "Snack AM",
      time: "10:00 AM",
      targetCals: targetCalories * mealDistribution.snack_am,
      template: getSnackTemplate(dayNumber, "am"),
    },
    {
      name: "Almuerzo",
      time: "1:00 PM",
      targetCals: targetCalories * mealDistribution.almuerzo,
      template: getLunchTemplate(dayNumber),
    },
    {
      name: "Snack PM",
      time: "4:00 PM",
      targetCals: targetCalories * mealDistribution.snack_pm,
      template: getSnackTemplate(dayNumber, "pm"),
    },
    {
      name: "Cena",
      time: "7:00 PM",
      targetCals: targetCalories * mealDistribution.cena,
      template: getDinnerTemplate(dayNumber),
    },
  ];

  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  const builtMeals = meals.map((meal) => {
    const foods = meal.template.map((foodKey) => FOODS[foodKey]).filter(Boolean);
    const mealCalories = foods.reduce((sum, f) => sum + f.calories, 0);

    totalCalories += mealCalories;
    totalProtein += foods.reduce((sum, f) => sum + f.protein, 0);
    totalCarbs += foods.reduce((sum, f) => sum + f.carbs, 0);
    totalFat += foods.reduce((sum, f) => sum + f.fat, 0);

    return {
      name: meal.name,
      time: meal.time,
      foods,
      calories: mealCalories,
    };
  });

  return {
    dayNumber,
    meals: builtMeals,
    totalCalories: Math.round(totalCalories),
    macros: {
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fat: Math.round(totalFat),
    },
  };
}

function getBreakfastTemplate(day: number): string[] {
  const templates = [
    ["huevos_enteros", "avena", "banano", "leche_descremada"],
    ["claras_huevo", "arepa", "queso_campesino", "papaya"],
    ["proteina_whey", "avena", "almendras", "fresas"],
    ["huevos_enteros", "pan_integral", "aguacate", "tomate"],
    ["yogurt_griego", "avena", "mani", "manzana"],
    ["claras_huevo", "batata", "espinaca", "mango"],
    ["huevos_enteros", "arepa", "queso_campesino", "banano"],
  ];
  return templates[(day - 1) % templates.length];
}

function getSnackTemplate(day: number, time: "am" | "pm"): string[] {
  const amTemplates = [
    ["yogurt_griego", "almendras"],
    ["manzana", "mantequilla_mani"],
    ["proteina_whey", "banano"],
    ["queso_cottage", "fresas"],
  ];
  const pmTemplates = [
    ["banano", "mani"],
    ["yogurt_griego", "mango"],
    ["almendras", "manzana"],
    ["proteina_whey", "leche_descremada"],
  ];
  const templates = time === "am" ? amTemplates : pmTemplates;
  return templates[(day - 1) % templates.length];
}

function getLunchTemplate(day: number): string[] {
  const templates = [
    ["pollo_pechuga", "arroz_integral", "ensalada_mixta", "aguacate"],
    ["carne_res_magra", "papa", "brocoli", "aceite_oliva"],
    ["pescado_tilapia", "arroz_blanco", "ensalada_mixta", "platano"],
    ["pollo_pechuga", "quinoa", "espinaca", "tomate"],
    ["atun_agua", "batata", "ensalada_mixta", "aguacate"],
    ["salmon", "arroz_integral", "brocoli", "aceite_oliva"],
    ["carne_res_magra", "yuca", "ensalada_mixta", "tomate"],
  ];
  return templates[(day - 1) % templates.length];
}

function getDinnerTemplate(day: number): string[] {
  const templates = [
    ["pollo_pechuga", "ensalada_mixta", "aguacate"],
    ["pescado_tilapia", "brocoli", "papa"],
    ["claras_huevo", "espinaca", "queso_campesino"],
    ["atun_agua", "ensalada_mixta", "aceite_oliva"],
    ["pollo_pechuga", "brocoli", "batata"],
    ["carne_res_magra", "ensalada_mixta", "aguacate"],
    ["salmon", "espinaca", "zanahoria"],
  ];
  return templates[(day - 1) % templates.length];
}

export { FOODS };
