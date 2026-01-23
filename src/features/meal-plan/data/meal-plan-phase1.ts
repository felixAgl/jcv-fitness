import type { MealPlanConfig } from "../types";
import { allExchanges } from "./food-exchanges";

export const mealPlanPhase1: MealPlanConfig = {
  phase: 1,
  phaseName: "Fase de Adaptacion",
  duration: "4 semanas",
  dailyMeals: 5,
  exchanges: allExchanges,
  days: [
    {
      day: 1,
      dayName: "Lunes",
      meals: [
        {
          id: "d1m1",
          name: "Desayuno",
          time: "7:00 AM",
          foods: [
            { name: "Claras de huevo", grams: 150 },
            { name: "Huevo entero", grams: 50, unit: "1 unidad" },
            { name: "Avena en hojuelas", grams: 40 },
            { name: "Banano", grams: 100 },
          ],
          notes: "Preparar las claras revueltas o en tortilla con el huevo entero",
        },
        {
          id: "d1m2",
          name: "Media Manana",
          time: "10:00 AM",
          foods: [
            { name: "Pechuga de pollo", grams: 100 },
            { name: "Arroz blanco", grams: 80 },
            { name: "Vegetales mixtos", grams: 100 },
          ],
        },
        {
          id: "d1m3",
          name: "Almuerzo",
          time: "1:00 PM",
          foods: [
            { name: "Carne de res magra", grams: 120 },
            { name: "Papa cocida", grams: 150 },
            { name: "Ensalada verde", grams: 150 },
            { name: "Aceite de oliva", grams: 10 },
          ],
        },
        {
          id: "d1m4",
          name: "Media Tarde",
          time: "4:00 PM",
          foods: [
            { name: "Atun en agua", grams: 100 },
            { name: "Galletas de arroz", grams: 30 },
            { name: "Aguacate", grams: 50 },
          ],
        },
        {
          id: "d1m5",
          name: "Cena",
          time: "7:00 PM",
          foods: [
            { name: "Pescado blanco", grams: 150 },
            { name: "Brocoli al vapor", grams: 150 },
            { name: "Aceite de oliva", grams: 5 },
          ],
          notes: "Ultima comida del dia, evitar carbohidratos simples",
        },
      ],
    },
    {
      day: 2,
      dayName: "Martes",
      meals: [
        {
          id: "d2m1",
          name: "Desayuno",
          time: "7:00 AM",
          foods: [
            { name: "Huevos revueltos", grams: 150, unit: "3 unidades" },
            { name: "Pan integral", grams: 50 },
            { name: "Aguacate", grams: 50 },
          ],
        },
        {
          id: "d2m2",
          name: "Media Manana",
          time: "10:00 AM",
          foods: [
            { name: "Pechuga de pollo", grams: 100 },
            { name: "Batata cocida", grams: 130 },
            { name: "Espinacas", grams: 100 },
          ],
        },
        {
          id: "d2m3",
          name: "Almuerzo",
          time: "1:00 PM",
          foods: [
            { name: "Salmon", grams: 120 },
            { name: "Quinoa cocida", grams: 100 },
            { name: "Ensalada mixta", grams: 150 },
            { name: "Aceite de oliva", grams: 10 },
          ],
        },
        {
          id: "d2m4",
          name: "Media Tarde",
          time: "4:00 PM",
          foods: [
            { name: "Pechuga de pavo", grams: 100 },
            { name: "Almendras", grams: 15 },
            { name: "Manzana", grams: 100 },
          ],
        },
        {
          id: "d2m5",
          name: "Cena",
          time: "7:00 PM",
          foods: [
            { name: "Pechuga de pollo", grams: 120 },
            { name: "Calabacin salteado", grams: 150 },
            { name: "Champiñones", grams: 100 },
          ],
        },
      ],
    },
    {
      day: 3,
      dayName: "Miercoles",
      meals: [
        {
          id: "d3m1",
          name: "Desayuno",
          time: "7:00 AM",
          foods: [
            { name: "Claras de huevo", grams: 150 },
            { name: "Avena en hojuelas", grams: 40 },
            { name: "Fresas", grams: 100 },
            { name: "Mantequilla de mani", grams: 15 },
          ],
        },
        {
          id: "d3m2",
          name: "Media Manana",
          time: "10:00 AM",
          foods: [
            { name: "Carne de res magra", grams: 100 },
            { name: "Arroz integral", grams: 100 },
            { name: "Brocoli", grams: 100 },
          ],
        },
        {
          id: "d3m3",
          name: "Almuerzo",
          time: "1:00 PM",
          foods: [
            { name: "Pechuga de pollo", grams: 150 },
            { name: "Pasta integral cocida", grams: 100 },
            { name: "Salsa de tomate natural", grams: 50 },
            { name: "Ensalada verde", grams: 100 },
          ],
        },
        {
          id: "d3m4",
          name: "Media Tarde",
          time: "4:00 PM",
          foods: [
            { name: "Atun en agua", grams: 100 },
            { name: "Aguacate", grams: 50 },
            { name: "Pepino", grams: 100 },
          ],
        },
        {
          id: "d3m5",
          name: "Cena",
          time: "7:00 PM",
          foods: [
            { name: "Tilapia", grams: 150 },
            { name: "Espárragos", grams: 100 },
            { name: "Coliflor al vapor", grams: 100 },
          ],
        },
      ],
    },
    {
      day: 4,
      dayName: "Jueves",
      meals: [
        {
          id: "d4m1",
          name: "Desayuno",
          time: "7:00 AM",
          foods: [
            { name: "Tortilla de claras", grams: 150 },
            { name: "Arepa de maiz", grams: 80 },
            { name: "Queso bajo en grasa", grams: 30 },
          ],
        },
        {
          id: "d4m2",
          name: "Media Manana",
          time: "10:00 AM",
          foods: [
            { name: "Pechuga de pollo", grams: 100 },
            { name: "Yuca cocida", grams: 80 },
            { name: "Ensalada de tomate", grams: 100 },
          ],
        },
        {
          id: "d4m3",
          name: "Almuerzo",
          time: "1:00 PM",
          foods: [
            { name: "Lomo de cerdo", grams: 120 },
            { name: "Arroz blanco", grams: 100 },
            { name: "Habichuelas", grams: 100 },
            { name: "Aceite de oliva", grams: 10 },
          ],
        },
        {
          id: "d4m4",
          name: "Media Tarde",
          time: "4:00 PM",
          foods: [
            { name: "Camarones", grams: 130 },
            { name: "Galletas integrales", grams: 30 },
            { name: "Limon", grams: 20 },
          ],
        },
        {
          id: "d4m5",
          name: "Cena",
          time: "7:00 PM",
          foods: [
            { name: "Pechuga de pavo", grams: 120 },
            { name: "Espinacas salteadas", grams: 150 },
            { name: "Pimenton", grams: 100 },
          ],
        },
      ],
    },
    {
      day: 5,
      dayName: "Viernes",
      meals: [
        {
          id: "d5m1",
          name: "Desayuno",
          time: "7:00 AM",
          foods: [
            { name: "Huevos revueltos", grams: 100, unit: "2 unidades" },
            { name: "Claras de huevo", grams: 100 },
            { name: "Pan integral tostado", grams: 50 },
            { name: "Aguacate", grams: 50 },
          ],
        },
        {
          id: "d5m2",
          name: "Media Manana",
          time: "10:00 AM",
          foods: [
            { name: "Pechuga de pollo", grams: 100 },
            { name: "Papa cocida", grams: 150 },
            { name: "Brocoli", grams: 100 },
          ],
        },
        {
          id: "d5m3",
          name: "Almuerzo",
          time: "1:00 PM",
          foods: [
            { name: "Carne de res magra", grams: 150 },
            { name: "Platano cocido", grams: 100 },
            { name: "Ensalada mixta", grams: 150 },
            { name: "Aceite de oliva", grams: 10 },
          ],
        },
        {
          id: "d5m4",
          name: "Media Tarde",
          time: "4:00 PM",
          foods: [
            { name: "Atun en agua", grams: 100 },
            { name: "Nueces", grams: 15 },
            { name: "Zanahoria", grams: 80 },
          ],
        },
        {
          id: "d5m5",
          name: "Cena",
          time: "7:00 PM",
          foods: [
            { name: "Salmon", grams: 120 },
            { name: "Vegetales al vapor", grams: 200 },
          ],
        },
      ],
    },
    {
      day: 6,
      dayName: "Sabado",
      meals: [
        {
          id: "d6m1",
          name: "Desayuno",
          time: "8:00 AM",
          foods: [
            { name: "Pancakes de avena", grams: 60, unit: "2 unidades" },
            { name: "Claras de huevo", grams: 100 },
            { name: "Frutos rojos", grams: 100 },
          ],
        },
        {
          id: "d6m2",
          name: "Media Manana",
          time: "11:00 AM",
          foods: [
            { name: "Pechuga de pollo", grams: 100 },
            { name: "Batata cocida", grams: 130 },
            { name: "Espinacas", grams: 100 },
          ],
        },
        {
          id: "d6m3",
          name: "Almuerzo",
          time: "2:00 PM",
          foods: [
            { name: "Pescado blanco", grams: 150 },
            { name: "Arroz con vegetales", grams: 120 },
            { name: "Ensalada verde", grams: 100 },
          ],
          notes: "Comida libre moderada - puede variar proteina",
        },
        {
          id: "d6m4",
          name: "Media Tarde",
          time: "5:00 PM",
          foods: [
            { name: "Yogur griego sin azucar", grams: 150 },
            { name: "Almendras", grams: 15 },
            { name: "Banano", grams: 80 },
          ],
        },
        {
          id: "d6m5",
          name: "Cena",
          time: "8:00 PM",
          foods: [
            { name: "Pechuga de pollo", grams: 120 },
            { name: "Champiñones salteados", grams: 100 },
            { name: "Calabacin", grams: 100 },
          ],
        },
      ],
    },
    {
      day: 7,
      dayName: "Domingo",
      meals: [
        {
          id: "d7m1",
          name: "Desayuno",
          time: "9:00 AM",
          foods: [
            { name: "Huevos al gusto", grams: 150, unit: "3 unidades" },
            { name: "Pan integral", grams: 50 },
            { name: "Aguacate", grams: 50 },
            { name: "Tomate", grams: 50 },
          ],
        },
        {
          id: "d7m2",
          name: "Media Manana",
          time: "12:00 PM",
          foods: [
            { name: "Pechuga de pollo", grams: 100 },
            { name: "Quinoa cocida", grams: 100 },
            { name: "Vegetales mixtos", grams: 100 },
          ],
        },
        {
          id: "d7m3",
          name: "Almuerzo",
          time: "3:00 PM",
          foods: [
            { name: "Carne de res", grams: 150 },
            { name: "Papa al horno", grams: 150 },
            { name: "Ensalada completa", grams: 150 },
            { name: "Aceite de oliva", grams: 10 },
          ],
          notes: "Comida principal del dia de descanso",
        },
        {
          id: "d7m4",
          name: "Media Tarde",
          time: "6:00 PM",
          foods: [
            { name: "Batido de proteina", grams: 30 },
            { name: "Leche de almendras", grams: 200 },
            { name: "Banano", grams: 100 },
          ],
        },
        {
          id: "d7m5",
          name: "Cena",
          time: "8:00 PM",
          foods: [
            { name: "Pechuga de pollo", grams: 120 },
            { name: "Ensalada verde grande", grams: 200 },
          ],
          notes: "Cena ligera para preparar la semana",
        },
      ],
    },
  ],
};
