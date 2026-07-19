import type { BilingualText, MealPlanConfig } from "../types";
import { allExchanges } from "./food-exchanges";

// Meal names repeat every day; keep a single source per label.
const DESAYUNO: BilingualText = { es: "Desayuno", en: "Breakfast" };
const MEDIA_MANANA: BilingualText = { es: "Media Mañana", en: "Mid-Morning Snack" };
const ALMUERZO: BilingualText = { es: "Almuerzo", en: "Lunch" };
const MEDIA_TARDE: BilingualText = { es: "Media Tarde", en: "Afternoon Snack" };
const CENA: BilingualText = { es: "Cena", en: "Dinner" };

export const mealPlanPhase1: MealPlanConfig = {
  phase: 1,
  phaseName: { es: "Fase de Adaptación", en: "Adaptation Phase" },
  duration: { es: "4 semanas", en: "4 weeks" },
  dailyMeals: 5,
  exchanges: allExchanges,
  days: [
    {
      day: 1,
      dayName: { es: "Lunes", en: "Monday" },
      meals: [
        {
          id: "d1m1",
          name: DESAYUNO,
          time: "7:00 AM",
          foods: [
            { name: { es: "Claras de huevo", en: "Egg whites" }, grams: 150 },
            {
              name: { es: "Huevo entero", en: "Whole egg" },
              grams: 50,
              unit: { es: "1 unidad", en: "1 unit" },
            },
            { name: { es: "Avena en hojuelas", en: "Rolled oats" }, grams: 40 },
            { name: { es: "Banano", en: "Banana" }, grams: 100 },
          ],
          notes: {
            es: "Preparar las claras revueltas o en tortilla con el huevo entero",
            en: "Scramble the egg whites or make an omelet with the whole egg",
          },
        },
        {
          id: "d1m2",
          name: MEDIA_MANANA,
          time: "10:00 AM",
          foods: [
            { name: { es: "Pechuga de pollo", en: "Chicken breast" }, grams: 100 },
            { name: { es: "Arroz blanco", en: "White rice" }, grams: 80 },
            { name: { es: "Vegetales mixtos", en: "Mixed vegetables" }, grams: 100 },
          ],
        },
        {
          id: "d1m3",
          name: ALMUERZO,
          time: "1:00 PM",
          foods: [
            { name: { es: "Carne de res magra", en: "Lean beef" }, grams: 120 },
            { name: { es: "Papa cocida", en: "Boiled potato" }, grams: 150 },
            { name: { es: "Ensalada verde", en: "Green salad" }, grams: 150 },
            { name: { es: "Aceite de oliva", en: "Olive oil" }, grams: 10 },
          ],
        },
        {
          id: "d1m4",
          name: MEDIA_TARDE,
          time: "4:00 PM",
          foods: [
            { name: { es: "Atun en agua", en: "Canned tuna in water" }, grams: 100 },
            { name: { es: "Galletas de arroz", en: "Rice cakes" }, grams: 30 },
            { name: { es: "Aguacate", en: "Avocado" }, grams: 50 },
          ],
        },
        {
          id: "d1m5",
          name: CENA,
          time: "7:00 PM",
          foods: [
            { name: { es: "Pescado blanco", en: "White fish" }, grams: 150 },
            { name: { es: "Brocoli al vapor", en: "Steamed broccoli" }, grams: 150 },
            { name: { es: "Aceite de oliva", en: "Olive oil" }, grams: 5 },
          ],
          notes: {
            es: "Última comida del día, evitar carbohidratos simples",
            en: "Last meal of the day, avoid simple carbs",
          },
        },
      ],
    },
    {
      day: 2,
      dayName: { es: "Martes", en: "Tuesday" },
      meals: [
        {
          id: "d2m1",
          name: DESAYUNO,
          time: "7:00 AM",
          foods: [
            {
              name: { es: "Huevos revueltos", en: "Scrambled eggs" },
              grams: 150,
              unit: { es: "3 unidades", en: "3 units" },
            },
            { name: { es: "Pan integral", en: "Whole wheat bread" }, grams: 50 },
            { name: { es: "Aguacate", en: "Avocado" }, grams: 50 },
          ],
        },
        {
          id: "d2m2",
          name: MEDIA_MANANA,
          time: "10:00 AM",
          foods: [
            { name: { es: "Pechuga de pollo", en: "Chicken breast" }, grams: 100 },
            { name: { es: "Batata cocida", en: "Boiled sweet potato" }, grams: 130 },
            { name: { es: "Espinacas", en: "Spinach" }, grams: 100 },
          ],
        },
        {
          id: "d2m3",
          name: ALMUERZO,
          time: "1:00 PM",
          foods: [
            { name: { es: "Salmon", en: "Salmon" }, grams: 120 },
            { name: { es: "Quinoa cocida", en: "Cooked quinoa" }, grams: 100 },
            { name: { es: "Ensalada mixta", en: "Mixed salad" }, grams: 150 },
            { name: { es: "Aceite de oliva", en: "Olive oil" }, grams: 10 },
          ],
        },
        {
          id: "d2m4",
          name: MEDIA_TARDE,
          time: "4:00 PM",
          foods: [
            { name: { es: "Pechuga de pavo", en: "Turkey breast" }, grams: 100 },
            { name: { es: "Almendras", en: "Almonds" }, grams: 15 },
            { name: { es: "Manzana", en: "Apple" }, grams: 100 },
          ],
        },
        {
          id: "d2m5",
          name: CENA,
          time: "7:00 PM",
          foods: [
            { name: { es: "Pechuga de pollo", en: "Chicken breast" }, grams: 120 },
            { name: { es: "Calabacin salteado", en: "Sauteed zucchini" }, grams: 150 },
            { name: { es: "Champiñones", en: "Mushrooms" }, grams: 100 },
          ],
        },
      ],
    },
    {
      day: 3,
      dayName: { es: "Miércoles", en: "Wednesday" },
      meals: [
        {
          id: "d3m1",
          name: DESAYUNO,
          time: "7:00 AM",
          foods: [
            { name: { es: "Claras de huevo", en: "Egg whites" }, grams: 150 },
            { name: { es: "Avena en hojuelas", en: "Rolled oats" }, grams: 40 },
            { name: { es: "Fresas", en: "Strawberries" }, grams: 100 },
            { name: { es: "Mantequilla de mani", en: "Peanut butter" }, grams: 15 },
          ],
        },
        {
          id: "d3m2",
          name: MEDIA_MANANA,
          time: "10:00 AM",
          foods: [
            { name: { es: "Carne de res magra", en: "Lean beef" }, grams: 100 },
            { name: { es: "Arroz integral", en: "Brown rice" }, grams: 100 },
            { name: { es: "Brocoli", en: "Broccoli" }, grams: 100 },
          ],
        },
        {
          id: "d3m3",
          name: ALMUERZO,
          time: "1:00 PM",
          foods: [
            { name: { es: "Pechuga de pollo", en: "Chicken breast" }, grams: 150 },
            {
              name: { es: "Pasta integral cocida", en: "Cooked whole wheat pasta" },
              grams: 100,
            },
            {
              name: { es: "Salsa de tomate natural", en: "Natural tomato sauce" },
              grams: 50,
            },
            { name: { es: "Ensalada verde", en: "Green salad" }, grams: 100 },
          ],
        },
        {
          id: "d3m4",
          name: MEDIA_TARDE,
          time: "4:00 PM",
          foods: [
            { name: { es: "Atun en agua", en: "Canned tuna in water" }, grams: 100 },
            { name: { es: "Aguacate", en: "Avocado" }, grams: 50 },
            { name: { es: "Pepino", en: "Cucumber" }, grams: 100 },
          ],
        },
        {
          id: "d3m5",
          name: CENA,
          time: "7:00 PM",
          foods: [
            { name: { es: "Tilapia", en: "Tilapia" }, grams: 150 },
            { name: { es: "Espárragos", en: "Asparagus" }, grams: 100 },
            { name: { es: "Coliflor al vapor", en: "Steamed cauliflower" }, grams: 100 },
          ],
        },
      ],
    },
    {
      day: 4,
      dayName: { es: "Jueves", en: "Thursday" },
      meals: [
        {
          id: "d4m1",
          name: DESAYUNO,
          time: "7:00 AM",
          foods: [
            { name: { es: "Tortilla de claras", en: "Egg white omelet" }, grams: 150 },
            { name: { es: "Arepa de maiz", en: "Corn arepa" }, grams: 80 },
            { name: { es: "Queso bajo en grasa", en: "Low-fat cheese" }, grams: 30 },
          ],
        },
        {
          id: "d4m2",
          name: MEDIA_MANANA,
          time: "10:00 AM",
          foods: [
            { name: { es: "Pechuga de pollo", en: "Chicken breast" }, grams: 100 },
            { name: { es: "Yuca cocida", en: "Boiled cassava" }, grams: 80 },
            { name: { es: "Ensalada de tomate", en: "Tomato salad" }, grams: 100 },
          ],
        },
        {
          id: "d4m3",
          name: ALMUERZO,
          time: "1:00 PM",
          foods: [
            { name: { es: "Lomo de cerdo", en: "Pork loin" }, grams: 120 },
            { name: { es: "Arroz blanco", en: "White rice" }, grams: 100 },
            { name: { es: "Habichuelas", en: "Green beans" }, grams: 100 },
            { name: { es: "Aceite de oliva", en: "Olive oil" }, grams: 10 },
          ],
        },
        {
          id: "d4m4",
          name: MEDIA_TARDE,
          time: "4:00 PM",
          foods: [
            { name: { es: "Camarones", en: "Shrimp" }, grams: 130 },
            {
              name: { es: "Galletas integrales", en: "Whole wheat crackers" },
              grams: 30,
            },
            { name: { es: "Limon", en: "Lemon" }, grams: 20 },
          ],
        },
        {
          id: "d4m5",
          name: CENA,
          time: "7:00 PM",
          foods: [
            { name: { es: "Pechuga de pavo", en: "Turkey breast" }, grams: 120 },
            { name: { es: "Espinacas salteadas", en: "Sauteed spinach" }, grams: 150 },
            { name: { es: "Pimenton", en: "Bell pepper" }, grams: 100 },
          ],
        },
      ],
    },
    {
      day: 5,
      dayName: { es: "Viernes", en: "Friday" },
      meals: [
        {
          id: "d5m1",
          name: DESAYUNO,
          time: "7:00 AM",
          foods: [
            {
              name: { es: "Huevos revueltos", en: "Scrambled eggs" },
              grams: 100,
              unit: { es: "2 unidades", en: "2 units" },
            },
            { name: { es: "Claras de huevo", en: "Egg whites" }, grams: 100 },
            {
              name: { es: "Pan integral tostado", en: "Whole wheat toast" },
              grams: 50,
            },
            { name: { es: "Aguacate", en: "Avocado" }, grams: 50 },
          ],
        },
        {
          id: "d5m2",
          name: MEDIA_MANANA,
          time: "10:00 AM",
          foods: [
            { name: { es: "Pechuga de pollo", en: "Chicken breast" }, grams: 100 },
            { name: { es: "Papa cocida", en: "Boiled potato" }, grams: 150 },
            { name: { es: "Brocoli", en: "Broccoli" }, grams: 100 },
          ],
        },
        {
          id: "d5m3",
          name: ALMUERZO,
          time: "1:00 PM",
          foods: [
            { name: { es: "Carne de res magra", en: "Lean beef" }, grams: 150 },
            { name: { es: "Platano cocido", en: "Boiled plantain" }, grams: 100 },
            { name: { es: "Ensalada mixta", en: "Mixed salad" }, grams: 150 },
            { name: { es: "Aceite de oliva", en: "Olive oil" }, grams: 10 },
          ],
        },
        {
          id: "d5m4",
          name: MEDIA_TARDE,
          time: "4:00 PM",
          foods: [
            { name: { es: "Atun en agua", en: "Canned tuna in water" }, grams: 100 },
            { name: { es: "Nueces", en: "Walnuts" }, grams: 15 },
            { name: { es: "Zanahoria", en: "Carrot" }, grams: 80 },
          ],
        },
        {
          id: "d5m5",
          name: CENA,
          time: "7:00 PM",
          foods: [
            { name: { es: "Salmon", en: "Salmon" }, grams: 120 },
            { name: { es: "Vegetales al vapor", en: "Steamed vegetables" }, grams: 200 },
          ],
        },
      ],
    },
    {
      day: 6,
      dayName: { es: "Sábado", en: "Saturday" },
      meals: [
        {
          id: "d6m1",
          name: DESAYUNO,
          time: "8:00 AM",
          foods: [
            {
              name: { es: "Pancakes de avena", en: "Oatmeal pancakes" },
              grams: 60,
              unit: { es: "2 unidades", en: "2 units" },
            },
            { name: { es: "Claras de huevo", en: "Egg whites" }, grams: 100 },
            { name: { es: "Frutos rojos", en: "Mixed berries" }, grams: 100 },
          ],
        },
        {
          id: "d6m2",
          name: MEDIA_MANANA,
          time: "11:00 AM",
          foods: [
            { name: { es: "Pechuga de pollo", en: "Chicken breast" }, grams: 100 },
            { name: { es: "Batata cocida", en: "Boiled sweet potato" }, grams: 130 },
            { name: { es: "Espinacas", en: "Spinach" }, grams: 100 },
          ],
        },
        {
          id: "d6m3",
          name: ALMUERZO,
          time: "2:00 PM",
          foods: [
            { name: { es: "Pescado blanco", en: "White fish" }, grams: 150 },
            {
              name: { es: "Arroz con vegetales", en: "Rice with vegetables" },
              grams: 120,
            },
            { name: { es: "Ensalada verde", en: "Green salad" }, grams: 100 },
          ],
          notes: {
            es: "Comida libre moderada - puede variar proteína",
            en: "Moderate free meal - protein can vary",
          },
        },
        {
          id: "d6m4",
          name: MEDIA_TARDE,
          time: "5:00 PM",
          foods: [
            {
              name: { es: "Yogur griego sin azucar", en: "Unsweetened Greek yogurt" },
              grams: 150,
            },
            { name: { es: "Almendras", en: "Almonds" }, grams: 15 },
            { name: { es: "Banano", en: "Banana" }, grams: 80 },
          ],
        },
        {
          id: "d6m5",
          name: CENA,
          time: "8:00 PM",
          foods: [
            { name: { es: "Pechuga de pollo", en: "Chicken breast" }, grams: 120 },
            {
              name: { es: "Champiñones salteados", en: "Sauteed mushrooms" },
              grams: 100,
            },
            { name: { es: "Calabacin", en: "Zucchini" }, grams: 100 },
          ],
        },
      ],
    },
    {
      day: 7,
      dayName: { es: "Domingo", en: "Sunday" },
      meals: [
        {
          id: "d7m1",
          name: DESAYUNO,
          time: "9:00 AM",
          foods: [
            {
              name: { es: "Huevos al gusto", en: "Eggs any style" },
              grams: 150,
              unit: { es: "3 unidades", en: "3 units" },
            },
            { name: { es: "Pan integral", en: "Whole wheat bread" }, grams: 50 },
            { name: { es: "Aguacate", en: "Avocado" }, grams: 50 },
            { name: { es: "Tomate", en: "Tomato" }, grams: 50 },
          ],
        },
        {
          id: "d7m2",
          name: MEDIA_MANANA,
          time: "12:00 PM",
          foods: [
            { name: { es: "Pechuga de pollo", en: "Chicken breast" }, grams: 100 },
            { name: { es: "Quinoa cocida", en: "Cooked quinoa" }, grams: 100 },
            { name: { es: "Vegetales mixtos", en: "Mixed vegetables" }, grams: 100 },
          ],
        },
        {
          id: "d7m3",
          name: ALMUERZO,
          time: "3:00 PM",
          foods: [
            { name: { es: "Carne de res", en: "Beef" }, grams: 150 },
            { name: { es: "Papa al horno", en: "Baked potato" }, grams: 150 },
            { name: { es: "Ensalada completa", en: "Full salad" }, grams: 150 },
            { name: { es: "Aceite de oliva", en: "Olive oil" }, grams: 10 },
          ],
          notes: {
            es: "Comida principal del día de descanso",
            en: "Main meal of the rest day",
          },
        },
        {
          id: "d7m4",
          name: MEDIA_TARDE,
          time: "6:00 PM",
          foods: [
            { name: { es: "Batido de proteina", en: "Protein shake" }, grams: 30 },
            { name: { es: "Leche de almendras", en: "Almond milk" }, grams: 200 },
            { name: { es: "Banano", en: "Banana" }, grams: 100 },
          ],
        },
        {
          id: "d7m5",
          name: CENA,
          time: "8:00 PM",
          foods: [
            { name: { es: "Pechuga de pollo", en: "Chicken breast" }, grams: 120 },
            {
              name: { es: "Ensalada verde grande", en: "Large green salad" },
              grams: 200,
            },
          ],
          notes: {
            es: "Cena ligera para preparar la semana",
            en: "Light dinner to get ready for the week",
          },
        },
      ],
    },
  ],
};
