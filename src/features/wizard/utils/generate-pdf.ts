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
  green: [74, 222, 128] as [number, number, number],
  orange: [251, 146, 60] as [number, number, number],
  yellow: [250, 204, 21] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  gray: [156, 163, 175] as [number, number, number],
  darkGray: [75, 85, 99] as [number, number, number],
  lightGray: [209, 213, 219] as [number, number, number],
  black: [0, 0, 0] as [number, number, number],
  bgDark: [15, 23, 42] as [number, number, number],
  bgCard: [30, 41, 59] as [number, number, number],
  bgCardLight: [51, 65, 85] as [number, number, number],
};

const DAY_NAMES = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];

const WORKOUT_EMOJIS: Record<string, string> = {
  "Tren Superior": "arm",
  "Tren Inferior": "leg",
  "Core + Cardio": "target",
  "Full Body": "trophy",
  "Push": "arm",
  "Pull": "gorilla",
  "Descanso": "meditation",
  "Descanso Activo": "meditation",
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
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;
  let pageNum = 1;

  // Generate plans
  const mealPlan = state.userBodyData && calories
    ? generateMealPlan(calories.target, state.userBodyData.weightGoal, 7)
    : null;

  const workoutPlan = state.level && state.goal
    ? generateWorkoutPlan(state.level, state.goal, state.selectedExercises, state.time)
    : null;

  const durationDays = state.duration === "1_dia" ? 1
    : state.duration === "3_dias" ? 3
    : state.duration === "1_semana" ? 7
    : state.duration === "2_semanas" ? 14
    : state.duration === "1_mes" ? 30
    : state.duration === "6_semanas" ? 42
    : state.duration === "2_meses" ? 60
    : state.duration === "3_meses" ? 90
    : 30;

  const userName = state.userName || "Guerrero";

  // ============ HELPER FUNCTIONS ============
  const drawBackground = () => {
    pdf.setFillColor(...COLORS.bgDark);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");
  };

  const addFooter = () => {
    pdf.setFontSize(7);
    pdf.setTextColor(...COLORS.darkGray);
    pdf.text(
      `Pag. ${pageNum} | JCV 24 Fitness - Tu transformacion comienza aqui | @jcv_24`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
  };

  const checkNewPage = (neededSpace: number): boolean => {
    if (y + neededSpace > pageHeight - 15) {
      addFooter();
      pdf.addPage();
      pageNum++;
      drawBackground();
      y = 20;
      return true;
    }
    return false;
  };

  const drawCard = (x: number, cardY: number, width: number, height: number, radius: number = 4) => {
    pdf.setFillColor(...COLORS.bgCard);
    pdf.roundedRect(x, cardY, width, height, radius, radius, "F");
    pdf.setDrawColor(...COLORS.cyan);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(x, cardY, width, height, radius, radius, "S");
  };

  const drawExerciseCard = (
    ex: { exerciseId: string; sets: number; reps: string; rest: string; notes?: string },
    exerciseInfo: Exercise | undefined,
    cardY: number
  ) => {
    const cardHeight = 28;

    // Card background with cyan left border
    pdf.setFillColor(...COLORS.bgCard);
    pdf.roundedRect(margin, cardY, contentWidth, cardHeight, 3, 3, "F");
    pdf.setFillColor(...COLORS.cyan);
    pdf.rect(margin, cardY + 3, 3, cardHeight - 6, "F");

    // Exercise name
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...COLORS.white);
    const exName = exerciseInfo?.name || ex.exerciseId.replace(/_/g, " ");
    pdf.text(exName, margin + 12, cardY + 10);

    // Technical name in cyan
    pdf.setFontSize(9);
    pdf.setTextColor(...COLORS.cyan);
    const techName = exerciseInfo?.muscle
      ? `"${exName}" - ${exerciseInfo.muscle}`
      : `${exName}`;
    pdf.text(techName, margin + 12, cardY + 17);

    // Muscle group
    if (exerciseInfo?.muscle) {
      pdf.setFontSize(8);
      pdf.setTextColor(...COLORS.orange);
      pdf.text(`Musculos: ${exerciseInfo.muscle}`, margin + 12, cardY + 23);
    }

    // Sets x Reps with big numbers
    const setsRepsX = pageWidth - margin - 50;
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...COLORS.cyan);
    pdf.text(`${ex.sets}x${ex.reps}`, setsRepsX, cardY + 14);

    // Rest time
    pdf.setFontSize(8);
    pdf.setTextColor(...COLORS.gray);
    pdf.text(`Descanso: ${ex.rest}`, setsRepsX, cardY + 21);

    // Checkbox for series (right side)
    const checkboxX = pageWidth - margin - 12;
    for (let i = 0; i < Math.min(ex.sets, 4); i++) {
      const checkY = cardY + 5 + i * 6;
      pdf.setDrawColor(...COLORS.cyan);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(checkboxX, checkY, 5, 5, 1, 1, "S");
      pdf.setFontSize(6);
      pdf.setTextColor(...COLORS.gray);
      pdf.text(String(i + 1), checkboxX + 1.5, checkY + 3.5);
    }

    return cardHeight + 4;
  };

  // ============ PAGE 1: COVER ============
  drawBackground();

  // Top half - dark with logo
  y = pageHeight * 0.35;

  // Bicep emoji area (simulated with text)
  pdf.setFontSize(40);
  pdf.setTextColor(...COLORS.orange);
  pdf.text("*", pageWidth / 2, y - 20, { align: "center" }); // Placeholder for emoji

  // JCV 24 FITNESS logo
  pdf.setFontSize(42);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...COLORS.cyan);
  pdf.text("JCV 24 FITNESS", pageWidth / 2, y + 10, { align: "center" });

  // Gradient line under logo
  pdf.setDrawColor(...COLORS.cyan);
  pdf.setLineWidth(2);
  pdf.line(pageWidth / 2 - 30, y + 18, pageWidth / 2 + 30, y + 18);

  // RUTINA PERSONALIZADA
  pdf.setFontSize(24);
  pdf.setTextColor(...COLORS.orange);
  pdf.text("RUTINA PERSONALIZADA", pageWidth / 2, y + 35, { align: "center" });

  // User name card
  const nameCardY = y + 50;
  drawCard(margin + 20, nameCardY, contentWidth - 40, 35);

  pdf.setFontSize(10);
  pdf.setTextColor(...COLORS.gray);
  pdf.text("Preparada para", pageWidth / 2, nameCardY + 12, { align: "center" });

  pdf.setFontSize(28);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...COLORS.cyan);
  pdf.text(userName.toUpperCase(), pageWidth / 2, nameCardY + 27, { align: "center" });

  // Stats cards row
  const statsY = nameCardY + 50;
  const cardWidth = (contentWidth - 20) / 3;

  // Objetivo card
  drawCard(margin, statsY, cardWidth, 38);
  pdf.setFontSize(8);
  pdf.setTextColor(...COLORS.gray);
  pdf.text("OBJETIVO", margin + cardWidth / 2, statsY + 12, { align: "center" });
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...COLORS.red);
  const goalText = state.goal ? TRANSLATIONS.goals[state.goal] : "Personalizado";
  pdf.text(goalText, margin + cardWidth / 2, statsY + 26, { align: "center" });

  // Duracion card
  drawCard(margin + cardWidth + 10, statsY, cardWidth, 38);
  pdf.setFontSize(8);
  pdf.setTextColor(...COLORS.gray);
  pdf.text("DURACION", margin + cardWidth * 1.5 + 10, statsY + 12, { align: "center" });
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...COLORS.cyan);
  const durationText = state.duration ? TRANSLATIONS.durations[state.duration] : `${durationDays} dias`;
  pdf.text(durationText, margin + cardWidth * 1.5 + 10, statsY + 26, { align: "center" });

  // Nivel card
  drawCard(margin + cardWidth * 2 + 20, statsY, cardWidth, 38);
  pdf.setFontSize(8);
  pdf.setTextColor(...COLORS.gray);
  pdf.text("NIVEL", margin + cardWidth * 2.5 + 20, statsY + 12, { align: "center" });
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...COLORS.orange);
  const levelText = state.level ? TRANSLATIONS.levels[state.level] : "Personalizado";
  pdf.text(levelText, margin + cardWidth * 2.5 + 20, statsY + 26, { align: "center" });

  // Generation date
  const today = new Date();
  const dateStr = today.toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  pdf.setFontSize(9);
  pdf.setTextColor(...COLORS.darkGray);
  pdf.text(`Generado el ${dateStr}`, pageWidth / 2, statsY + 55, { align: "center" });

  addFooter();

  // ============ PAGE 2: TU PLAN DE ENTRENAMIENTO ============
  pdf.addPage();
  pageNum++;
  drawBackground();
  y = 25;

  // Section title with icon
  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...COLORS.white);
  pdf.text("TU PLAN DE ENTRENAMIENTO", margin, y);
  y += 8;

  pdf.setFontSize(10);
  pdf.setTextColor(...COLORS.gray);
  pdf.text("Todo lo que necesitas saber sobre tu rutina", margin, y);
  y += 15;

  // Program data card
  drawCard(margin, y, contentWidth, 45);

  pdf.setFillColor(...COLORS.cyan);
  pdf.rect(margin, y, 3, 45, "F");

  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...COLORS.white);
  pdf.text("Datos de tu Programa", margin + 12, y + 12);

  const dataStartY = y + 20;
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");

  // Left column
  pdf.setTextColor(...COLORS.gray);
  pdf.text("Sesiones por dia:", margin + 12, dataStartY);
  pdf.setTextColor(...COLORS.white);
  pdf.setFont("helvetica", "bold");
  pdf.text(`${state.time} minutos`, margin + 55, dataStartY);

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...COLORS.gray);
  pdf.text("Ejercicios incluidos:", margin + 12, dataStartY + 8);
  pdf.setTextColor(...COLORS.white);
  pdf.setFont("helvetica", "bold");
  pdf.text(`${state.selectedExercises.length || "12"}`, margin + 55, dataStartY + 8);

  // Right column
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...COLORS.gray);
  pdf.text("Total de dias:", pageWidth / 2 + 10, dataStartY);
  pdf.setTextColor(...COLORS.white);
  pdf.setFont("helvetica", "bold");
  pdf.text(`${durationDays} dias`, pageWidth / 2 + 45, dataStartY);

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...COLORS.gray);
  pdf.text("Equipamiento:", pageWidth / 2 + 10, dataStartY + 8);
  pdf.setTextColor(...COLORS.white);
  pdf.setFont("helvetica", "bold");
  const equipText = state.equipment.map(e => TRANSLATIONS.equipment[e]).join(", ");
  pdf.text(equipText.substring(0, 30), pageWidth / 2 + 45, dataStartY + 8);

  y += 55;

  // Exercise list section
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...COLORS.white);
  pdf.text("EJERCICIOS DE TU RUTINA", margin, y);
  y += 5;

  pdf.setFontSize(9);
  pdf.setTextColor(...COLORS.gray);
  pdf.text("Nombre coloquial (Como se dice en Colombia) - Nombre tecnico en ingles", margin, y);
  y += 10;

  // Group exercises by muscle group
  const muscleGroups = new Map<string, Exercise[]>();
  const selectedExs = state.selectedExercises.length > 0
    ? exercises.filter(e => state.selectedExercises.includes(e.id))
    : exercises.slice(0, 12);

  selectedExs.forEach(ex => {
    const group = ex.muscle || "Otros";
    if (!muscleGroups.has(group)) {
      muscleGroups.set(group, []);
    }
    muscleGroups.get(group)!.push(ex);
  });

  const groupColors: Record<string, [number, number, number]> = {
    "Piernas": COLORS.yellow,
    "Pecho": COLORS.orange,
    "Espalda": COLORS.cyan,
    "Brazos": COLORS.green,
    "Core": COLORS.red,
    "Cardio": COLORS.orange,
  };

  muscleGroups.forEach((exs, group) => {
    checkNewPage(20 + exs.length * 18);

    // Group header
    const groupColor = groupColors[group] || COLORS.cyan;
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...groupColor);
    pdf.text(group.toUpperCase(), margin, y);
    y += 7;

    // Exercises in this group
    exs.forEach(ex => {
      checkNewPage(18);

      pdf.setFillColor(...COLORS.bgCard);
      pdf.roundedRect(margin, y - 2, contentWidth, 15, 2, 2, "F");

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...COLORS.white);
      pdf.text(ex.name, margin + 10, y + 6);

      pdf.setFontSize(8);
      pdf.setTextColor(...COLORS.cyan);
      pdf.text(`"${ex.name}" - ${ex.techName || ex.id}`, margin + 10, y + 11);

      pdf.setTextColor(...COLORS.orange);
      pdf.text(`Musculos: ${ex.muscle}`, pageWidth / 2 + 10, y + 11);

      // Sets info on right
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...COLORS.cyan);
      pdf.text("4 series", pageWidth - margin - 25, y + 6);
      pdf.setTextColor(...COLORS.gray);
      pdf.text("15-20 reps", pageWidth - margin - 25, y + 11);

      y += 17;
    });

    y += 5;
  });

  addFooter();

  // ============ DAILY WORKOUT PAGES ============
  if (workoutPlan && workoutPlan.length > 0) {
    workoutPlan.forEach((day, dayIndex) => {
      pdf.addPage();
      pageNum++;
      drawBackground();
      y = 25;

      // Day header
      const dayName = DAY_NAMES[dayIndex % 7];

      pdf.setFontSize(10);
      pdf.setTextColor(...COLORS.gray);
      pdf.text(`DIA ${day.dayNumber} DE ${durationDays}`, margin, y);
      y += 12;

      pdf.setFontSize(32);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...COLORS.white);
      pdf.text(dayName, margin, y);

      // Workout type
      pdf.setFontSize(14);
      pdf.setTextColor(...COLORS.red);
      pdf.text(day.name, margin, y + 10);

      // Duration badge on right
      pdf.setFontSize(10);
      pdf.setTextColor(...COLORS.cyan);
      pdf.text(`${state.time} min`, pageWidth - margin - 5, y, { align: "right" });

      y += 25;

      if (day.restDay) {
        // Rest day card
        drawCard(margin, y, contentWidth, 50);
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...COLORS.cyan);
        pdf.text("DIA DE RECUPERACION", margin + 10, y + 20);

        pdf.setFontSize(10);
        pdf.setTextColor(...COLORS.gray);
        pdf.text("Opciones para hoy:", margin + 10, y + 30);
        pdf.text("- Caminata ligera de 20-30 minutos", margin + 10, y + 38);
        pdf.text("- Estiramientos y movilidad", margin + 10, y + 44);

        y += 60;
      } else {
        // Warmup section
        pdf.setFillColor(...COLORS.bgCard);
        pdf.roundedRect(margin, y, contentWidth, 40, 3, 3, "F");
        pdf.setFillColor(...COLORS.cyan);
        pdf.roundedRect(margin, y, contentWidth, 3, 3, 3, "F");

        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...COLORS.white);
        pdf.text("CALENTAMIENTO (5 min)", margin + 10, y + 15);

        const warmupItems = [
          "Trote en el puesto - 1 min",
          "Rotacion de brazos - 1 min",
          "Sentadillas suaves - 1 min",
          "Jumping Jacks - 1 min",
          "Rodillas al pecho - 1 min",
        ];

        pdf.setFontSize(8);
        pdf.setTextColor(...COLORS.lightGray);
        warmupItems.slice(0, 3).forEach((item, i) => {
          pdf.text(`- ${item}`, margin + 10, y + 23 + i * 5);
        });
        warmupItems.slice(3).forEach((item, i) => {
          pdf.text(`- ${item}`, pageWidth / 2, y + 23 + i * 5);
        });

        y += 48;

        // Main workout section
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...COLORS.white);
        pdf.text("RUTINA PRINCIPAL", margin, y);
        y += 10;

        // Exercise cards
        day.exercises.forEach((ex) => {
          checkNewPage(35);
          const exerciseInfo = exercises.find(e => e.id === ex.exerciseId);
          const cardHeight = drawExerciseCard(ex, exerciseInfo, y);
          y += cardHeight;
        });

        y += 5;

        // Cooldown section
        checkNewPage(45);
        pdf.setFillColor(...COLORS.bgCard);
        pdf.roundedRect(margin, y, contentWidth, 35, 3, 3, "F");

        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...COLORS.white);
        pdf.text("ENFRIAMIENTO Y ESTIRAMIENTOS (5 min)", margin + 10, y + 12);

        const cooldownItems = [
          "Estiramiento de cuadriceps - 30s c/lado",
          "Estiramiento de hombros - 30s c/lado",
          "Estiramiento de isquiotibiales - 30s c/lado",
          "Respiracion profunda - 1 min",
        ];

        pdf.setFontSize(8);
        pdf.setTextColor(...COLORS.lightGray);
        cooldownItems.slice(0, 2).forEach((item, i) => {
          pdf.text(`- ${item}`, margin + 10, y + 20 + i * 5);
        });
        cooldownItems.slice(2).forEach((item, i) => {
          pdf.text(`- ${item}`, pageWidth / 2, y + 20 + i * 5);
        });

        y += 42;

        // Notes section
        checkNewPage(30);
        pdf.setDrawColor(...COLORS.cyan);
        pdf.setLineWidth(0.3);
        pdf.setLineDashPattern([2, 2], 0);
        pdf.roundedRect(margin, y, contentWidth, 25, 3, 3, "S");
        pdf.setLineDashPattern([], 0);

        pdf.setFontSize(9);
        pdf.setTextColor(...COLORS.gray);
        pdf.text("Notas del dia:", margin + 5, y + 8);
      }

      addFooter();
    });
  }

  // ============ CALENDAR PAGE ============
  pdf.addPage();
  pageNum++;
  drawBackground();
  y = 25;

  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...COLORS.white);
  pdf.text(`CALENDARIO DE ${durationDays} DIAS`, pageWidth / 2, y, { align: "center" });
  y += 8;

  pdf.setFontSize(10);
  pdf.setTextColor(...COLORS.gray);
  pdf.text("Repite el patron semanal durante todo el programa", pageWidth / 2, y, { align: "center" });
  y += 15;

  // Weekly pattern
  drawCard(margin, y, contentWidth, 45);

  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...COLORS.white);
  pdf.text("PATRON SEMANAL A REPETIR", margin + 10, y + 12);

  const weekDays = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"];
  const dayWidth = (contentWidth - 20) / 7;

  weekDays.forEach((day, i) => {
    const dayX = margin + 10 + i * dayWidth;
    const dayY = y + 20;

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...COLORS.white);
    pdf.text(day, dayX + dayWidth / 2, dayY + 8, { align: "center" });

    // Workout type for this day
    const workoutForDay = workoutPlan?.[i];
    if (workoutForDay) {
      pdf.setFontSize(6);
      const textColor = workoutForDay.restDay ? COLORS.gray : COLORS.cyan;
      pdf.setTextColor(...textColor);
      const shortName = workoutForDay.name.length > 10
        ? workoutForDay.name.substring(0, 10) + "..."
        : workoutForDay.name;
      pdf.text(shortName, dayX + dayWidth / 2, dayY + 16, { align: "center" });
    }
  });

  y += 55;

  // Progress tracker
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...COLORS.green);
  pdf.text("REGISTRO DE PROGRESO", margin, y);
  y += 10;

  // Draw day checkboxes (7 columns)
  const cols = 7;
  const boxSize = 18;
  const boxGap = 3;
  const totalBoxWidth = cols * boxSize + (cols - 1) * boxGap;
  const startX = margin + (contentWidth - totalBoxWidth) / 2;

  let row = 0;
  for (let d = 1; d <= Math.min(durationDays, 42); d++) {
    const col = (d - 1) % cols;
    if (col === 0 && d > 1) {
      row++;
      if (y + row * (boxSize + boxGap) > pageHeight - 40) break;
    }

    const boxX = startX + col * (boxSize + boxGap);
    const boxY = y + row * (boxSize + boxGap);

    pdf.setFillColor(...COLORS.bgCardLight);
    pdf.roundedRect(boxX, boxY, boxSize, boxSize, 2, 2, "F");

    pdf.setFontSize(6);
    pdf.setTextColor(...COLORS.gray);
    pdf.text("Dia", boxX + boxSize / 2, boxY + 5, { align: "center" });

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...COLORS.white);
    pdf.text(String(d), boxX + boxSize / 2, boxY + 12, { align: "center" });

    // Checkbox
    pdf.setDrawColor(...COLORS.cyan);
    pdf.setLineWidth(0.3);
    pdf.rect(boxX + boxSize / 2 - 2, boxY + 14, 4, 4);
  }

  addFooter();

  // ============ WEEKLY/MONTHLY SUMMARY PAGE ============
  const totalWeeks = Math.ceil(durationDays / 7);
  const isMonthly = durationDays >= 28;

  if (totalWeeks > 1) {
    pdf.addPage();
    pageNum++;
    drawBackground();
    y = 25;

    // Header
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...COLORS.white);
    const summaryTitle = isMonthly
      ? `RESUMEN MENSUAL - ${Math.ceil(durationDays / 30)} MES${durationDays > 30 ? "ES" : ""}`
      : `RESUMEN SEMANAL - ${totalWeeks} SEMANAS`;
    pdf.text(summaryTitle, pageWidth / 2, y, { align: "center" });
    y += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(...COLORS.gray);
    pdf.text(`Tu programa de ${durationDays} dias dividido en semanas`, pageWidth / 2, y, { align: "center" });
    y += 18;

    // Weekly breakdown
    for (let week = 1; week <= Math.min(totalWeeks, 12); week++) {
      checkNewPage(45);

      const weekStartDay = (week - 1) * 7 + 1;
      const weekEndDay = Math.min(week * 7, durationDays);
      const monthNum = Math.ceil(weekEndDay / 30);

      // Week card
      drawCard(margin, y, contentWidth, 35);

      // Week number with color badge
      pdf.setFillColor(...(week % 4 === 1 ? COLORS.cyan : week % 4 === 2 ? COLORS.green : week % 4 === 3 ? COLORS.orange : COLORS.red));
      pdf.roundedRect(margin + 5, y + 5, 50, 25, 3, 3, "F");

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...COLORS.white);
      pdf.text("SEMANA", margin + 30, y + 13, { align: "center" });

      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text(String(week), margin + 30, y + 25, { align: "center" });

      // Week details
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...COLORS.white);
      pdf.text(`Dias ${weekStartDay} - ${weekEndDay}`, margin + 65, y + 13);

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...COLORS.gray);
      if (isMonthly) {
        pdf.text(`Mes ${monthNum}`, margin + 65, y + 21);
      }

      // Weekly stats
      const trainingDays = workoutPlan?.filter(d => !d.restDay).length || 5;
      const restDays = 7 - trainingDays;

      pdf.setTextColor(...COLORS.cyan);
      pdf.text(`${trainingDays} dias entrenamiento`, pageWidth - margin - 80, y + 13);
      pdf.setTextColor(...COLORS.orange);
      pdf.text(`${restDays} dias descanso`, pageWidth - margin - 80, y + 21);

      // Progress checkbox
      pdf.setDrawColor(...COLORS.cyan);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(pageWidth - margin - 20, y + 10, 12, 12, 2, 2, "S");
      pdf.setFontSize(6);
      pdf.setTextColor(...COLORS.gray);
      pdf.text("OK", pageWidth - margin - 14, y + 17.5);

      y += 40;
    }

    // Monthly milestones if applicable
    if (isMonthly && durationDays >= 30) {
      checkNewPage(60);
      y += 5;

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...COLORS.yellow);
      pdf.text("METAS MENSUALES", margin, y);
      y += 12;

      const milestones = [
        { month: 1, title: "Mes 1 - Adaptacion", desc: "Tu cuerpo se adapta al nuevo ritmo. Enfocate en la tecnica." },
        { month: 2, title: "Mes 2 - Progresion", desc: "Aumenta cargas gradualmente. Los cambios son visibles." },
        { month: 3, title: "Mes 3 - Consolidacion", desc: "Habitos establecidos. Transformacion en marcha." },
      ];

      const totalMonths = Math.ceil(durationDays / 30);

      milestones.slice(0, totalMonths).forEach((m) => {
        checkNewPage(25);

        pdf.setFillColor(...COLORS.bgCard);
        pdf.roundedRect(margin, y, contentWidth, 20, 2, 2, "F");

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...COLORS.yellow);
        pdf.text(m.title, margin + 8, y + 8);

        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...COLORS.lightGray);
        pdf.text(m.desc, margin + 8, y + 15);

        y += 24;
      });
    }

    addFooter();
  }

  // ============ MOTIVATIONAL FINAL PAGE ============
  pdf.addPage();
  pageNum++;
  drawBackground();

  y = pageHeight * 0.35;

  // Trophy icon area
  pdf.setFontSize(50);
  pdf.setTextColor(...COLORS.yellow);
  pdf.text("*", pageWidth / 2, y - 30, { align: "center" }); // Placeholder

  // Motivational message
  pdf.setFontSize(36);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...COLORS.white);
  pdf.text(`TU PUEDES, ${userName.toUpperCase()}!`, pageWidth / 2, y, { align: "center" });

  // Gradient line
  pdf.setDrawColor(...COLORS.cyan);
  pdf.setLineWidth(2);
  pdf.line(pageWidth / 2 - 40, y + 12, pageWidth / 2 + 40, y + 12);

  y += 30;

  // Quote
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "italic");
  pdf.setTextColor(...COLORS.gray);
  pdf.text('"El unico entrenamiento malo es el que no hiciste"', pageWidth / 2, y, { align: "center" });

  y += 30;

  // Contact info card
  drawCard(margin + 30, y, contentWidth - 60, 50);

  pdf.setFontSize(11);
  pdf.setTextColor(...COLORS.white);
  pdf.text("Dudas o seguimiento?", pageWidth / 2, y + 15, { align: "center" });

  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...COLORS.green);
  pdf.text("WhatsApp: 314 382 64 30", pageWidth / 2, y + 28, { align: "center" });

  pdf.setFontSize(11);
  pdf.setTextColor(...COLORS.cyan);
  pdf.text("Instagram: @jcv_24", pageWidth / 2, y + 40, { align: "center" });

  addFooter();

  // ============ MEAL PLAN PAGES ============
  if (mealPlan && mealPlan.length > 0 && state.userBodyData) {
    pdf.addPage();
    pageNum++;
    drawBackground();
    y = 25;

    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...COLORS.white);
    pdf.text("PLAN DE ALIMENTACION", margin, y);
    y += 10;

    // Macro distribution
    const macroRatio = state.userBodyData.weightGoal === "perder"
      ? "40% Proteina | 30% Carbos | 30% Grasa"
      : state.userBodyData.weightGoal === "ganar"
      ? "30% Proteina | 45% Carbos | 25% Grasa"
      : "30% Proteina | 40% Carbos | 30% Grasa";

    pdf.setFontSize(10);
    pdf.setTextColor(...COLORS.gray);
    pdf.text(`Distribucion de macros: ${macroRatio}`, margin, y);
    y += 15;

    mealPlan.forEach((day) => {
      checkNewPage(70);

      // Day header
      pdf.setFillColor(...COLORS.bgCard);
      pdf.roundedRect(margin, y, contentWidth, 10, 2, 2, "F");
      pdf.setFillColor(...COLORS.green);
      pdf.rect(margin, y, 4, 10, "F");

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...COLORS.green);
      pdf.text(`DIA ${day.dayNumber}`, margin + 8, y + 7);

      pdf.setFontSize(9);
      pdf.setTextColor(...COLORS.white);
      pdf.text(
        `${day.totalCalories} kcal | P:${day.macros.protein}g C:${day.macros.carbs}g G:${day.macros.fat}g`,
        pageWidth - margin - 5,
        y + 7,
        { align: "right" }
      );

      y += 14;

      // Meals
      day.meals.forEach((meal) => {
        checkNewPage(25);

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...COLORS.green);
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

      y += 8;
    });

    addFooter();
  }

  // ============ SAVE PDF ============
  const date = new Date().toISOString().split("T")[0];
  const fileName = state.userName
    ? `JCV_Fitness_${state.userName.replace(/\s/g, "_")}_${date}.pdf`
    : `JCV_Fitness_Plan_${date}.pdf`;

  pdf.save(fileName);
}
