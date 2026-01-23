import type { FoodExchange } from "../types";

export const proteinExchanges: FoodExchange[] = [
  { category: "protein", name: "Pechuga de pollo", equivalentGrams: 100, baseFood: "pollo" },
  { category: "protein", name: "Claras de huevo", equivalentGrams: 150, baseFood: "pollo" },
  { category: "protein", name: "Carne de res magra", equivalentGrams: 100, baseFood: "pollo" },
  { category: "protein", name: "Pescado blanco (tilapia, bagre)", equivalentGrams: 120, baseFood: "pollo" },
  { category: "protein", name: "Salmon", equivalentGrams: 90, baseFood: "pollo" },
  { category: "protein", name: "Atun en agua", equivalentGrams: 100, baseFood: "pollo" },
  { category: "protein", name: "Lomo de cerdo", equivalentGrams: 100, baseFood: "pollo" },
  { category: "protein", name: "Pavo", equivalentGrams: 100, baseFood: "pollo" },
  { category: "protein", name: "Camarones", equivalentGrams: 130, baseFood: "pollo" },
  { category: "protein", name: "Tofu firme", equivalentGrams: 150, baseFood: "pollo" },
];

export const carbExchanges: FoodExchange[] = [
  { category: "carbs", name: "Arroz blanco cocido", equivalentGrams: 100, baseFood: "arroz" },
  { category: "carbs", name: "Arroz integral cocido", equivalentGrams: 110, baseFood: "arroz" },
  { category: "carbs", name: "Papa cocida", equivalentGrams: 150, baseFood: "arroz" },
  { category: "carbs", name: "Batata/Camote cocido", equivalentGrams: 130, baseFood: "arroz" },
  { category: "carbs", name: "Avena en hojuelas", equivalentGrams: 40, baseFood: "arroz" },
  { category: "carbs", name: "Pan integral", equivalentGrams: 50, baseFood: "arroz" },
  { category: "carbs", name: "Pasta cocida", equivalentGrams: 100, baseFood: "arroz" },
  { category: "carbs", name: "Quinoa cocida", equivalentGrams: 100, baseFood: "arroz" },
  { category: "carbs", name: "Platano", equivalentGrams: 100, baseFood: "arroz" },
  { category: "carbs", name: "Yuca cocida", equivalentGrams: 80, baseFood: "arroz" },
  { category: "carbs", name: "Arepa de maiz", equivalentGrams: 80, baseFood: "arroz" },
];

export const fatExchanges: FoodExchange[] = [
  { category: "fats", name: "Aceite de oliva", equivalentGrams: 10, baseFood: "aceite" },
  { category: "fats", name: "Aguacate", equivalentGrams: 50, baseFood: "aceite" },
  { category: "fats", name: "Almendras", equivalentGrams: 15, baseFood: "aceite" },
  { category: "fats", name: "Mani natural", equivalentGrams: 15, baseFood: "aceite" },
  { category: "fats", name: "Nueces", equivalentGrams: 15, baseFood: "aceite" },
  { category: "fats", name: "Mantequilla de mani natural", equivalentGrams: 15, baseFood: "aceite" },
  { category: "fats", name: "Semillas de chia", equivalentGrams: 12, baseFood: "aceite" },
  { category: "fats", name: "Aceite de coco", equivalentGrams: 10, baseFood: "aceite" },
];

export const vegetableExchanges: FoodExchange[] = [
  { category: "vegetables", name: "Brocoli", equivalentGrams: 100, baseFood: "vegetales" },
  { category: "vegetables", name: "Espinaca", equivalentGrams: 100, baseFood: "vegetales" },
  { category: "vegetables", name: "Lechuga", equivalentGrams: 100, baseFood: "vegetales" },
  { category: "vegetables", name: "Tomate", equivalentGrams: 100, baseFood: "vegetales" },
  { category: "vegetables", name: "Pepino", equivalentGrams: 100, baseFood: "vegetales" },
  { category: "vegetables", name: "Zanahoria", equivalentGrams: 80, baseFood: "vegetales" },
  { category: "vegetables", name: "Calabacin", equivalentGrams: 100, baseFood: "vegetales" },
  { category: "vegetables", name: "Pimenton", equivalentGrams: 100, baseFood: "vegetales" },
  { category: "vegetables", name: "Cebolla", equivalentGrams: 50, baseFood: "vegetales" },
  { category: "vegetables", name: "Champiñones", equivalentGrams: 100, baseFood: "vegetales" },
  { category: "vegetables", name: "Coliflor", equivalentGrams: 100, baseFood: "vegetales" },
  { category: "vegetables", name: "Habichuelas", equivalentGrams: 100, baseFood: "vegetales" },
];

export const allExchanges: FoodExchange[] = [
  ...proteinExchanges,
  ...carbExchanges,
  ...fatExchanges,
  ...vegetableExchanges,
];
