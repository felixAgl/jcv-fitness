import jsPDF from "jspdf";
import type { WizardState, Exercise } from "../types";
import { TRANSLATIONS } from "../types";
import { generateMealPlan } from "../data/meal-templates";
import { generateWorkoutPlan, getVideoUrl } from "../data/workout-templates";

interface PDFData {
  state: WizardState;
  exercises: Exercise[];
  calories: { bmr: number; tdee: number; target: number } | null;
}

const COLORS = {
  cyan: [34, 211, 238] as [number, number, number],
  red: [239, 68, 68] as [number, number, number],
  green: [57, 255, 20] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  gray: [156, 163, 175] as [number, number, number],
  darkGray: [75, 85, 99] as [number, number, number],
  lightGray: [209, 213, 219] as [number, number, number],
  black: [0, 0, 0] as [number, number, number],
  bgCard: [15, 23, 42] as [number, number, number],
};

export async function generateWorkoutPDF(data: PDFData): Promise<void> {
  const { state, exercises, calories } = data;
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;
  let pageNum = 1;

  // Generar planes
  const mealPlan = state.userBodyData && calories
    ? generateMealPlan(calories.target, state.userBodyData.weightGoal, 7)
    : null;

  const workoutPlan = state.level && state.goal
    ? generateWorkoutPlan(state.level, state.goal, state.selectedExercises, state.time)
    : null;

  // ============ HELPER FUNCTIONS ============
  const addHeader = (title: string) => {
    pdf.setFillColor(...COLORS.black);
    pdf.rect(0, 0, pageWidth, 28, "F");

    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...COLORS.cyan);
    pdf.text("JCV", margin, 18);
    pdf.setTextColor(...COLORS.white);
    pdf.text("FITNESS", margin + 16, 18);

    pdf.setFontSize(9);
    pdf.setTextColor(...COLORS.gray);
    pdf.text(title, pageWidth - margin, 18, { align: "right" });

    y = 35;
  };

  const addFooter = () => {
    pdf.setFontSize(7);
    pdf.setTextColor(...COLORS.darkGray);
    pdf.text(
      `Pag. ${pageNum} | JCV Fitness - Tu transformacion comienza aqui | www.jcvfitness.com`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
  };

  const checkNewPage = (neededSpace: number, headerTitle: string = "Plan Personalizado"): boolean => {
    if (y + neededSpace > pageHeight - 15) {
      addFooter();
      pdf.addPage();
      pageNum++;
      addHeader(headerTitle);
      return true;
    }
    return false;
  };

  const drawSectionTitle = (title: string, color: [number, number, number] = COLORS.cyan) => {
    pdf.setFillColor(...color);
    pdf.rect(margin, y - 1, 3, 8, "F");
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...COLORS.white);
    pdf.text(title, margin + 6, y + 5);
    y += 12;
  };

  const drawInfoRow = (label: string, value: string, labelWidth: number = 40) => {
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...COLORS.gray);
    pdf.text(label, margin + 4, y);
    pdf.setTextColor(...COLORS.white);
    pdf.text(value, margin + labelWidth, y);
    y += 5;
  };

  // ============ PAGE 1: COVER & PROFILE ============
  addHeader("Tu Plan Personalizado");

  // Welcome message
  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...COLORS.white);
  const welcomeName = state.userName || "Guerrero";
  pdf.text(`Hola, ${welcomeName}!`, margin, y);
  y += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...COLORS.gray);
  pdf.text("Este es tu plan personalizado de entrenamiento y alimentacion.", margin, y);
  y += 12;

  // Profile Card
  pdf.setFillColor(...COLORS.bgCard);
  pdf.roundedRect(margin, y, contentWidth, 55, 3, 3, "F");
  y += 8;

  drawSectionTitle("TU PERFIL", COLORS.cyan);

  if (state.level) drawInfoRow("Nivel:", TRANSLATIONS.levels[state.level]);
  if (state.goal) drawInfoRow("Objetivo:", TRANSLATIONS.goals[state.goal]);
  drawInfoRow("Tiempo/sesion:", `${state.time} minutos`);
  if (state.duration) drawInfoRow("Duracion:", TRANSLATIONS.durations[state.duration]);
  drawInfoRow("Equipo:", state.equipment.map(e => TRANSLATIONS.equipment[e]).join(", "));

  y += 8;

  // Body Data Card
  if (state.userBodyData && calories) {
    pdf.setFillColor(...COLORS.bgCard);
    pdf.roundedRect(margin, y, contentWidth, 65, 3, 3, "F");
    y += 8;

    drawSectionTitle("TUS DATOS CORPORALES", COLORS.green);

    const bd = state.userBodyData;
    drawInfoRow("Genero:", bd.gender === "masculino" ? "Masculino" : "Femenino");
    drawInfoRow("Edad:", `${bd.age} anos`);
    drawInfoRow("Altura:", `${bd.height} cm`);
    drawInfoRow("Peso actual:", `${bd.currentWeight} kg`);
    drawInfoRow("Peso objetivo:", `${bd.targetWeight} kg`);

    y += 5;

    // Calories Box
    const boxY = y;
    const boxHeight = 20;
    const colWidth = contentWidth / 3;

    pdf.setFillColor(10, 20, 35);
    pdf.roundedRect(margin, boxY, contentWidth, boxHeight, 2, 2, "F");

    // BMR
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...COLORS.gray);
    pdf.text(String(calories.bmr), margin + colWidth / 2, boxY + 10, { align: "center" });
    pdf.setFontSize(7);
    pdf.setTextColor(...COLORS.darkGray);
    pdf.text("BMR (Basal)", margin + colWidth / 2, boxY + 16, { align: "center" });

    // TDEE
    pdf.setFontSize(14);
    pdf.setTextColor(...COLORS.white);
    pdf.text(String(calories.tdee), margin + colWidth * 1.5, boxY + 10, { align: "center" });
    pdf.setFontSize(7);
    pdf.setTextColor(...COLORS.gray);
    pdf.text("TDEE (Diario)", margin + colWidth * 1.5, boxY + 16, { align: "center" });

    // Target
    pdf.setFontSize(16);
    pdf.setTextColor(...COLORS.green);
    pdf.text(String(calories.target), margin + colWidth * 2.5, boxY + 10, { align: "center" });
    pdf.setFontSize(7);
    pdf.text("CALORIAS OBJETIVO", margin + colWidth * 2.5, boxY + 16, { align: "center" });

    y = boxY + boxHeight + 10;
  }

  addFooter();

  // ============ PAGE 2+: WORKOUT PLAN ============
  if (workoutPlan && workoutPlan.length > 0) {
    pdf.addPage();
    pageNum++;
    addHeader("Plan de Entrenamiento");

    drawSectionTitle("RUTINA SEMANAL", COLORS.red);

    workoutPlan.forEach((day) => {
      checkNewPage(day.restDay ? 12 : 45, "Plan de Entrenamiento");

      // Day header
      pdf.setFillColor(day.restDay ? 40 : 25, day.restDay ? 40 : 35, day.restDay ? 45 : 55);
      pdf.roundedRect(margin, y, contentWidth, day.restDay ? 10 : 8, 2, 2, "F");

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...(day.restDay ? COLORS.gray : COLORS.cyan));
      pdf.text(`DIA ${day.dayNumber}: ${day.name}`, margin + 4, y + 6);

      if (!day.restDay && day.duration) {
        pdf.setFontSize(8);
        pdf.setTextColor(...COLORS.gray);
        pdf.text(`${day.duration} min`, pageWidth - margin - 4, y + 6, { align: "right" });
      }

      y += day.restDay ? 14 : 12;

      if (day.restDay) {
        pdf.setFontSize(8);
        pdf.setTextColor(...COLORS.darkGray);
        pdf.text("Recuperacion activa: caminar, estirar, descansar.", margin + 4, y);
        y += 8;
        return;
      }

      // Exercises table
      day.exercises.forEach((ex, idx) => {
        checkNewPage(8, "Plan de Entrenamiento");

        const bgColor = idx % 2 === 0 ? [20, 25, 35] : [15, 20, 30];
        pdf.setFillColor(...(bgColor as [number, number, number]));
        pdf.rect(margin, y - 1, contentWidth, 7, "F");

        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...COLORS.white);

        // Exercise name
        const exerciseName = exercises.find(e => e.id === ex.exerciseId)?.name || ex.exerciseId;
        pdf.text(exerciseName, margin + 3, y + 4);

        // Sets x Reps
        pdf.setTextColor(...COLORS.cyan);
        pdf.text(`${ex.sets}x${ex.reps}`, margin + 75, y + 4);

        // Rest
        pdf.setTextColor(...COLORS.gray);
        pdf.text(ex.rest, margin + 100, y + 4);

        // Video link indicator
        const videoUrl = getVideoUrl(ex.exerciseId);
        if (videoUrl) {
          pdf.setTextColor(...COLORS.red);
          pdf.text("[VIDEO]", pageWidth - margin - 3, y + 4, { align: "right" });
        }

        y += 7;

        // Notes
        if (ex.notes) {
          pdf.setFontSize(7);
          pdf.setTextColor(...COLORS.darkGray);
          pdf.text(`  Tip: ${ex.notes}`, margin + 3, y + 2);
          y += 5;
        }
      });

      y += 6;
    });

    // Video Links Section
    addFooter();
    pdf.addPage();
    pageNum++;
    addHeader("Videos de Ejercicios");

    drawSectionTitle("LINKS DE VIDEOS", COLORS.red);

    pdf.setFontSize(8);
    pdf.setTextColor(...COLORS.gray);
    pdf.text("Escanea el QR o visita los enlaces para ver la tecnica correcta de cada ejercicio:", margin, y);
    y += 8;

    const allExerciseIds = new Set<string>();
    workoutPlan.forEach(day => {
      day.exercises.forEach(ex => allExerciseIds.add(ex.exerciseId));
    });

    Array.from(allExerciseIds).forEach((exId) => {
      const videoUrl = getVideoUrl(exId);
      if (!videoUrl) return;

      checkNewPage(7, "Videos de Ejercicios");

      const exerciseName = exercises.find(e => e.id === exId)?.name || exId;

      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...COLORS.white);
      pdf.text(exerciseName, margin + 3, y);

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...COLORS.cyan);
      pdf.textWithLink(videoUrl, margin + 50, y, { url: videoUrl });

      y += 6;
    });
  }

  // ============ MEAL PLAN ============
  if (mealPlan && mealPlan.length > 0 && state.userBodyData) {
    addFooter();
    pdf.addPage();
    pageNum++;
    addHeader("Plan de Alimentacion");

    drawSectionTitle("PLAN NUTRICIONAL SEMANAL", COLORS.green);

    // Macro distribution
    const macroRatio = state.userBodyData.weightGoal === "perder"
      ? "40% Proteina | 30% Carbos | 30% Grasa"
      : state.userBodyData.weightGoal === "ganar"
      ? "30% Proteina | 45% Carbos | 25% Grasa"
      : "30% Proteina | 40% Carbos | 30% Grasa";

    pdf.setFontSize(9);
    pdf.setTextColor(...COLORS.gray);
    pdf.text(`Distribucion de macros: ${macroRatio}`, margin, y);
    y += 8;

    mealPlan.forEach((day) => {
      checkNewPage(55, "Plan de Alimentacion");

      // Day header
      pdf.setFillColor(20, 40, 30);
      pdf.roundedRect(margin, y, contentWidth, 8, 2, 2, "F");

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...COLORS.green);
      pdf.text(`DIA ${day.dayNumber}`, margin + 4, y + 6);

      pdf.setFontSize(8);
      pdf.setTextColor(...COLORS.white);
      pdf.text(
        `${day.totalCalories} kcal | P:${day.macros.protein}g C:${day.macros.carbs}g G:${day.macros.fat}g`,
        pageWidth - margin - 4,
        y + 6,
        { align: "right" }
      );

      y += 12;

      // Meals
      day.meals.forEach((meal) => {
        checkNewPage(20, "Plan de Alimentacion");

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...COLORS.cyan);
        pdf.text(`${meal.time} - ${meal.name}`, margin + 3, y);
        pdf.setTextColor(...COLORS.gray);
        pdf.text(`${meal.calories} kcal`, pageWidth - margin - 3, y, { align: "right" });
        y += 5;

        meal.foods.forEach((food) => {
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(...COLORS.lightGray);
          pdf.text(`- ${food.name} (${food.portion})`, margin + 6, y);
          y += 4;
        });

        y += 3;
      });

      y += 5;
    });

    // Nutrition Tips
    addFooter();
    pdf.addPage();
    pageNum++;
    addHeader("Consejos Nutricionales");

    drawSectionTitle("GUIA NUTRICIONAL", COLORS.green);

    const nutritionTips = [
      {
        title: "PROTEINAS - La Base del Musculo",
        tips: [
          `Consume ${state.userBodyData.weightGoal === "ganar" ? "2.0-2.2" : "1.6-2.0"}g por kg de peso corporal`,
          "Fuentes: pollo, pescado, huevos, carne magra, legumbres",
          "Distribuye en 4-5 comidas para mejor absorcion",
          "Incluye proteina en cada comida principal",
        ],
      },
      {
        title: "CARBOHIDRATOS - Tu Energia",
        tips: [
          "Prioriza carbohidratos complejos y de bajo indice glucemico",
          "Mejores opciones: arroz integral, avena, batata, quinoa, platano",
          "Consume mas carbos antes y despues del entrenamiento",
          "Reduce carbos simples (azucares, harinas refinadas)",
        ],
      },
      {
        title: "GRASAS SALUDABLES - Hormonas y Salud",
        tips: [
          "20-30% de tus calorias totales deben venir de grasas",
          "Fuentes: aguacate, aceite de oliva, frutos secos, salmon",
          "Evita grasas trans y procesadas",
          "Las grasas son esenciales para la absorcion de vitaminas",
        ],
      },
      {
        title: "HIDRATACION - El Factor Olvidado",
        tips: [
          "Minimo 35ml por kg de peso corporal (ej: 70kg = 2.5L)",
          "Aumenta 500ml-1L en dias de entrenamiento",
          "Agua natural es la mejor opcion",
          "Evita bebidas azucaradas y alcohol",
        ],
      },
      {
        title: "TIMING NUTRICIONAL",
        tips: [
          "Pre-entreno (1-2h antes): carbos + proteina",
          "Post-entreno (30-60min): proteina + carbos rapidos",
          "No saltees comidas, mantén un horario regular",
          "Ultima comida: 2-3 horas antes de dormir",
        ],
      },
    ];

    nutritionTips.forEach((section) => {
      checkNewPage(30, "Consejos Nutricionales");

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...COLORS.green);
      pdf.text(section.title, margin, y);
      y += 6;

      section.tips.forEach((tip) => {
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...COLORS.lightGray);
        pdf.text(`- ${tip}`, margin + 4, y);
        y += 5;
      });

      y += 4;
    });
  }

  // ============ FINAL PAGE: MOTIVATION ============
  addFooter();
  pdf.addPage();
  pageNum++;
  addHeader("Tu Compromiso");

  y = 60;

  pdf.setFontSize(20);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...COLORS.cyan);
  pdf.text("RECUERDA", pageWidth / 2, y, { align: "center" });
  y += 15;

  const motivationalQuotes = [
    "La consistencia supera a la perfeccion.",
    "Cada entrenamiento te acerca a tu mejor version.",
    "No es sobre ser el mejor, es sobre ser mejor que ayer.",
    "Tu unico limite eres tu mismo.",
    "El dolor de hoy es la fuerza de manana.",
  ];

  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...COLORS.white);

  motivationalQuotes.forEach((quote) => {
    pdf.text(`"${quote}"`, pageWidth / 2, y, { align: "center" });
    y += 10;
  });

  y += 15;

  pdf.setFontSize(11);
  pdf.setTextColor(...COLORS.gray);
  pdf.text("Contacto y seguimiento:", pageWidth / 2, y, { align: "center" });
  y += 8;

  pdf.setTextColor(...COLORS.green);
  pdf.text("WhatsApp: 314 382 64 30", pageWidth / 2, y, { align: "center" });
  y += 6;
  pdf.setTextColor(...COLORS.cyan);
  pdf.text("Instagram: @jcvfitness", pageWidth / 2, y, { align: "center" });

  addFooter();

  // ============ SAVE PDF ============
  const date = new Date().toISOString().split("T")[0];
  const fileName = state.userName
    ? `JCV_Fitness_${state.userName.replace(/\s/g, "_")}_${date}.pdf`
    : `JCV_Fitness_Plan_${date}.pdf`;

  pdf.save(fileName);
}
