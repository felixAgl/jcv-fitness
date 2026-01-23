import jsPDF from "jspdf";
import type { WizardState, Exercise } from "../types";
import { TRANSLATIONS } from "../types";

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
  black: [0, 0, 0] as [number, number, number],
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
  let y = margin;

  const addHeader = () => {
    pdf.setFillColor(...COLORS.black);
    pdf.rect(0, 0, pageWidth, 35, "F");

    pdf.setFontSize(24);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...COLORS.cyan);
    pdf.text("JCV", margin, 22);

    pdf.setTextColor(...COLORS.white);
    pdf.text("FITNESS", margin + 22, 22);

    pdf.setFontSize(10);
    pdf.setTextColor(...COLORS.gray);
    pdf.text("Tu Rutina Personalizada", pageWidth - margin, 22, { align: "right" });

    y = 45;
  };

  const addFooter = (pageNum: number) => {
    pdf.setFontSize(8);
    pdf.setTextColor(...COLORS.gray);
    pdf.text(
      `Pagina ${pageNum} - Generado por JCV Fitness`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  };

  const checkNewPage = (neededSpace: number) => {
    if (y + neededSpace > pageHeight - 20) {
      addFooter(pdf.getNumberOfPages());
      pdf.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // Page 1: Cover & Summary
  addHeader();

  // User name
  if (state.userName) {
    pdf.setFontSize(16);
    pdf.setTextColor(...COLORS.white);
    pdf.text(`Hola, ${state.userName}!`, margin, y);
    y += 10;
  }

  // Summary Section
  pdf.setFontSize(14);
  pdf.setTextColor(...COLORS.cyan);
  pdf.text("Resumen de tu Programa", margin, y);
  y += 8;

  pdf.setFontSize(10);
  pdf.setTextColor(...COLORS.gray);

  const summaryItems = [
    ["Nivel:", state.level ? TRANSLATIONS.levels[state.level] : "-"],
    ["Objetivo:", state.goal ? TRANSLATIONS.goals[state.goal] : "-"],
    ["Tiempo por sesion:", `${state.time} minutos`],
    ["Duracion:", state.duration ? TRANSLATIONS.durations[state.duration] : "-"],
    ["Equipo:", state.equipment.map((e) => TRANSLATIONS.equipment[e]).join(", ")],
  ];

  summaryItems.forEach(([label, value]) => {
    pdf.setTextColor(...COLORS.gray);
    pdf.text(label, margin, y);
    pdf.setTextColor(...COLORS.white);
    pdf.text(value, margin + 45, y);
    y += 6;
  });

  y += 10;

  // Body Data Section
  if (state.userBodyData) {
    pdf.setFontSize(14);
    pdf.setTextColor(...COLORS.cyan);
    pdf.text("Tus Datos Corporales", margin, y);
    y += 8;

    pdf.setFontSize(10);

    const bodyItems = [
      ["Genero:", state.userBodyData.gender === "masculino" ? "Masculino" : "Femenino"],
      ["Edad:", `${state.userBodyData.age} anos`],
      ["Altura:", `${state.userBodyData.height} cm`],
      ["Peso actual:", `${state.userBodyData.currentWeight} kg`],
      ["Peso objetivo:", `${state.userBodyData.targetWeight} kg`],
    ];

    bodyItems.forEach(([label, value]) => {
      pdf.setTextColor(...COLORS.gray);
      pdf.text(label, margin, y);
      pdf.setTextColor(...COLORS.white);
      pdf.text(value, margin + 35, y);
      y += 6;
    });

    y += 5;

    // Calories box
    if (calories) {
      pdf.setFillColor(20, 30, 50);
      pdf.roundedRect(margin, y, pageWidth - margin * 2, 25, 3, 3, "F");

      const boxCenterY = y + 12.5;
      const colWidth = (pageWidth - margin * 2) / 3;

      pdf.setFontSize(16);
      pdf.setTextColor(...COLORS.gray);
      pdf.text(String(calories.bmr), margin + colWidth / 2, boxCenterY - 2, { align: "center" });
      pdf.setFontSize(8);
      pdf.text("BMR", margin + colWidth / 2, boxCenterY + 6, { align: "center" });

      pdf.setFontSize(16);
      pdf.setTextColor(...COLORS.white);
      pdf.text(String(calories.tdee), margin + colWidth * 1.5, boxCenterY - 2, { align: "center" });
      pdf.setFontSize(8);
      pdf.text("TDEE", margin + colWidth * 1.5, boxCenterY + 6, { align: "center" });

      pdf.setFontSize(18);
      pdf.setTextColor(...COLORS.green);
      pdf.text(String(calories.target), margin + colWidth * 2.5, boxCenterY - 2, { align: "center" });
      pdf.setFontSize(8);
      pdf.text("OBJETIVO", margin + colWidth * 2.5, boxCenterY + 6, { align: "center" });

      y += 30;
    }
  }

  addFooter(1);

  // Page 2+: Exercises
  pdf.addPage();
  y = margin;

  pdf.setFontSize(18);
  pdf.setTextColor(...COLORS.cyan);
  pdf.text("Tus Ejercicios", margin, y);
  y += 10;

  const groupedExercises = exercises.reduce((acc, exercise) => {
    if (!acc[exercise.category]) {
      acc[exercise.category] = [];
    }
    acc[exercise.category].push(exercise);
    return acc;
  }, {} as Record<string, Exercise[]>);

  Object.entries(groupedExercises).forEach(([category, categoryExercises]) => {
    checkNewPage(20);

    pdf.setFontSize(12);
    pdf.setTextColor(...COLORS.red);
    pdf.text(
      TRANSLATIONS.categories[category as keyof typeof TRANSLATIONS.categories].toUpperCase(),
      margin,
      y
    );
    y += 7;

    categoryExercises.forEach((exercise) => {
      checkNewPage(10);

      pdf.setFontSize(10);
      pdf.setTextColor(...COLORS.white);
      pdf.text(`${exercise.emoji} ${exercise.name}`, margin + 5, y);

      if (exercise.altName) {
        pdf.setFontSize(8);
        pdf.setTextColor(...COLORS.gray);
        pdf.text(`(${exercise.altName})`, margin + 60, y);
      }

      pdf.setFontSize(8);
      pdf.setTextColor(...COLORS.darkGray);
      pdf.text(exercise.muscle, pageWidth - margin, y, { align: "right" });

      y += 6;
    });

    y += 5;
  });

  addFooter(pdf.getNumberOfPages());

  // Page: Nutrition Guide
  pdf.addPage();
  y = margin;

  pdf.setFontSize(18);
  pdf.setTextColor(...COLORS.cyan);
  pdf.text("Guia Nutricional Basica", margin, y);
  y += 10;

  pdf.setFontSize(10);
  pdf.setTextColor(...COLORS.gray);
  pdf.text(
    "Nota: Esta es una guia orientativa. Consulta un nutricionista para un plan personalizado.",
    margin,
    y,
    { maxWidth: pageWidth - margin * 2 }
  );
  y += 15;

  const nutritionTips = [
    {
      title: "Proteinas",
      tips: [
        "Consume 1.6-2.2g por kg de peso corporal",
        "Fuentes: pollo, pescado, huevos, legumbres",
        "Distribuye en 4-5 comidas al dia",
      ],
    },
    {
      title: "Carbohidratos",
      tips: [
        "Prioriza carbohidratos complejos",
        "Arroz integral, avena, batata, quinoa",
        "Consume mas cerca del entrenamiento",
      ],
    },
    {
      title: "Grasas Saludables",
      tips: [
        "20-35% de tus calorias totales",
        "Aguacate, frutos secos, aceite de oliva",
        "Evita grasas trans y procesadas",
      ],
    },
    {
      title: "Hidratacion",
      tips: [
        "Minimo 2-3 litros de agua al dia",
        "Aumenta en dias de entrenamiento",
        "Evita bebidas azucaradas",
      ],
    },
  ];

  nutritionTips.forEach((section) => {
    checkNewPage(30);

    pdf.setFontSize(12);
    pdf.setTextColor(...COLORS.green);
    pdf.text(section.title, margin, y);
    y += 6;

    section.tips.forEach((tip) => {
      pdf.setFontSize(9);
      pdf.setTextColor(...COLORS.white);
      pdf.text(`- ${tip}`, margin + 5, y);
      y += 5;
    });

    y += 5;
  });

  addFooter(pdf.getNumberOfPages());

  // Save PDF
  const fileName = state.userName
    ? `JCV_Fitness_${state.userName.replace(/\s/g, "_")}.pdf`
    : "JCV_Fitness_Rutina.pdf";

  pdf.save(fileName);
}
