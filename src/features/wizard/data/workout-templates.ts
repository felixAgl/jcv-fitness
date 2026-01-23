import type { TrainingLevel, TrainingGoal, WorkoutDay, WorkoutExercise } from "../types";

interface WorkoutConfig {
  setsMultiplier: number;
  repsRange: { min: number; max: number };
  restSeconds: number;
  daysPerWeek: number;
}

const LEVEL_CONFIG: Record<TrainingLevel, WorkoutConfig> = {
  principiante: { setsMultiplier: 0.75, repsRange: { min: 10, max: 15 }, restSeconds: 90, daysPerWeek: 3 },
  basico: { setsMultiplier: 0.85, repsRange: { min: 10, max: 12 }, restSeconds: 75, daysPerWeek: 4 },
  intermedio: { setsMultiplier: 1, repsRange: { min: 8, max: 12 }, restSeconds: 60, daysPerWeek: 5 },
  avanzado: { setsMultiplier: 1.15, repsRange: { min: 6, max: 10 }, restSeconds: 45, daysPerWeek: 5 },
  elite: { setsMultiplier: 1.25, repsRange: { min: 4, max: 8 }, restSeconds: 30, daysPerWeek: 6 },
};

const GOAL_ADJUSTMENTS: Record<TrainingGoal, { repsAdjust: number; setsAdjust: number; restAdjust: number }> = {
  perder_grasa: { repsAdjust: 3, setsAdjust: 0, restAdjust: -15 },
  ganar_musculo: { repsAdjust: 0, setsAdjust: 1, restAdjust: 15 },
  tonificar: { repsAdjust: 2, setsAdjust: 0, restAdjust: 0 },
  resistencia: { repsAdjust: 5, setsAdjust: 0, restAdjust: -20 },
  flexibilidad: { repsAdjust: 3, setsAdjust: -1, restAdjust: 30 },
  fuerza: { repsAdjust: -4, setsAdjust: 1, restAdjust: 60 },
  energia: { repsAdjust: 2, setsAdjust: 0, restAdjust: 0 },
  salud: { repsAdjust: 2, setsAdjust: 0, restAdjust: 15 },
};

// Ejercicios con videos de YouTube (canales fitness en espanol)
export const EXERCISE_VIDEOS: Record<string, string> = {
  sentadilla: "https://youtu.be/aclHkVaku9U",
  peso_muerto: "https://youtu.be/op9kVnSso6Q",
  press_banca: "https://youtu.be/rT7DgCr-3pg",
  dominadas: "https://youtu.be/eGo4IYlbE5g",
  remo_barra: "https://youtu.be/9efgcAjQe7E",
  press_hombro: "https://youtu.be/qEwKCR5JCog",
  curl_biceps: "https://youtu.be/ykJmrZ5v0Oo",
  extension_triceps: "https://youtu.be/2-LAMcpzODU",
  plancha: "https://youtu.be/pSHjTRCQxIw",
  zancadas: "https://youtu.be/QOVaHwm-Q6U",
  hip_thrust: "https://youtu.be/xDmFkJxPzeM",
  fondos: "https://youtu.be/2z8JmcrW-As",
  face_pull: "https://youtu.be/rep-qVOkqgk",
  elevaciones_laterales: "https://youtu.be/3VcKaXpzqRo",
  prensa_pierna: "https://youtu.be/IZxyjW7MPJQ",
  extension_cuadriceps: "https://youtu.be/YyvSfVjQeL0",
  curl_femoral: "https://youtu.be/1Tq3QdYUuHs",
  pantorrillas: "https://youtu.be/gwLzBJYoWlI",
  crunch: "https://youtu.be/Xyd_fa5zoEU",
  mountain_climber: "https://youtu.be/nmwgirgXLYM",
  burpees: "https://youtu.be/dZgVxmf6jkA",
  jumping_jacks: "https://youtu.be/c4DAnQ6DtF8",
};

// Splits de entrenamiento segun dias por semana
const WORKOUT_SPLITS = {
  3: [
    { name: "Dia A - Cuerpo Completo", muscleGroups: ["piernas", "pecho", "espalda", "core"] },
    { name: "Descanso", muscleGroups: [], restDay: true },
    { name: "Dia B - Cuerpo Completo", muscleGroups: ["piernas", "hombros", "brazos", "core"] },
    { name: "Descanso", muscleGroups: [], restDay: true },
    { name: "Dia C - Cuerpo Completo", muscleGroups: ["piernas", "pecho", "espalda", "cardio"] },
    { name: "Descanso", muscleGroups: [], restDay: true },
    { name: "Descanso", muscleGroups: [], restDay: true },
  ],
  4: [
    { name: "Dia 1 - Tren Superior", muscleGroups: ["pecho", "espalda", "hombros"] },
    { name: "Dia 2 - Tren Inferior", muscleGroups: ["piernas", "gluteos", "core"] },
    { name: "Descanso", muscleGroups: [], restDay: true },
    { name: "Dia 3 - Push", muscleGroups: ["pecho", "hombros", "triceps"] },
    { name: "Dia 4 - Pull", muscleGroups: ["espalda", "biceps", "core"] },
    { name: "Descanso", muscleGroups: [], restDay: true },
    { name: "Descanso", muscleGroups: [], restDay: true },
  ],
  5: [
    { name: "Dia 1 - Pecho", muscleGroups: ["pecho", "triceps"] },
    { name: "Dia 2 - Espalda", muscleGroups: ["espalda", "biceps"] },
    { name: "Dia 3 - Piernas", muscleGroups: ["cuadriceps", "femoral", "gluteos"] },
    { name: "Dia 4 - Hombros", muscleGroups: ["hombros", "trapecios", "core"] },
    { name: "Dia 5 - Brazos + Core", muscleGroups: ["biceps", "triceps", "core"] },
    { name: "Descanso", muscleGroups: [], restDay: true },
    { name: "Descanso", muscleGroups: [], restDay: true },
  ],
  6: [
    { name: "Dia 1 - Push", muscleGroups: ["pecho", "hombros", "triceps"] },
    { name: "Dia 2 - Pull", muscleGroups: ["espalda", "biceps", "antebrazos"] },
    { name: "Dia 3 - Piernas", muscleGroups: ["cuadriceps", "femoral", "gluteos", "pantorrillas"] },
    { name: "Dia 4 - Push", muscleGroups: ["pecho", "hombros", "triceps"] },
    { name: "Dia 5 - Pull", muscleGroups: ["espalda", "biceps", "core"] },
    { name: "Dia 6 - Piernas", muscleGroups: ["cuadriceps", "femoral", "gluteos"] },
    { name: "Descanso", muscleGroups: [], restDay: true },
  ],
};

// Ejercicios por grupo muscular
const EXERCISES_BY_MUSCLE: Record<string, { id: string; baseSets: number; baseReps: string }[]> = {
  pecho: [
    { id: "press_banca", baseSets: 4, baseReps: "8-12" },
    { id: "press_inclinado", baseSets: 3, baseReps: "10-12" },
    { id: "aperturas", baseSets: 3, baseReps: "12-15" },
    { id: "fondos", baseSets: 3, baseReps: "8-12" },
  ],
  espalda: [
    { id: "dominadas", baseSets: 4, baseReps: "6-10" },
    { id: "remo_barra", baseSets: 4, baseReps: "8-12" },
    { id: "jalon_polea", baseSets: 3, baseReps: "10-12" },
    { id: "remo_mancuerna", baseSets: 3, baseReps: "10-12" },
  ],
  piernas: [
    { id: "sentadilla", baseSets: 4, baseReps: "8-12" },
    { id: "peso_muerto", baseSets: 4, baseReps: "6-10" },
    { id: "zancadas", baseSets: 3, baseReps: "10-12" },
    { id: "prensa_pierna", baseSets: 3, baseReps: "12-15" },
  ],
  cuadriceps: [
    { id: "sentadilla", baseSets: 4, baseReps: "8-12" },
    { id: "prensa_pierna", baseSets: 4, baseReps: "10-15" },
    { id: "extension_cuadriceps", baseSets: 3, baseReps: "12-15" },
    { id: "sentadilla_bulgara", baseSets: 3, baseReps: "10-12" },
  ],
  femoral: [
    { id: "peso_muerto_rumano", baseSets: 4, baseReps: "8-12" },
    { id: "curl_femoral", baseSets: 3, baseReps: "10-15" },
    { id: "buenos_dias", baseSets: 3, baseReps: "10-12" },
  ],
  gluteos: [
    { id: "hip_thrust", baseSets: 4, baseReps: "10-15" },
    { id: "patada_gluteo", baseSets: 3, baseReps: "12-15" },
    { id: "peso_muerto_sumo", baseSets: 3, baseReps: "8-12" },
  ],
  hombros: [
    { id: "press_hombro", baseSets: 4, baseReps: "8-12" },
    { id: "elevaciones_laterales", baseSets: 3, baseReps: "12-15" },
    { id: "elevaciones_frontales", baseSets: 3, baseReps: "12-15" },
    { id: "face_pull", baseSets: 3, baseReps: "15-20" },
  ],
  biceps: [
    { id: "curl_biceps", baseSets: 3, baseReps: "10-12" },
    { id: "curl_martillo", baseSets: 3, baseReps: "10-12" },
    { id: "curl_concentrado", baseSets: 3, baseReps: "12-15" },
  ],
  triceps: [
    { id: "extension_triceps", baseSets: 3, baseReps: "10-12" },
    { id: "fondos_banco", baseSets: 3, baseReps: "10-15" },
    { id: "press_frances", baseSets: 3, baseReps: "10-12" },
  ],
  core: [
    { id: "plancha", baseSets: 3, baseReps: "30-60s" },
    { id: "crunch", baseSets: 3, baseReps: "15-20" },
    { id: "mountain_climber", baseSets: 3, baseReps: "20-30" },
    { id: "elevacion_piernas", baseSets: 3, baseReps: "12-15" },
  ],
  pantorrillas: [
    { id: "elevacion_pantorrillas", baseSets: 4, baseReps: "15-20" },
    { id: "pantorrillas_sentado", baseSets: 3, baseReps: "15-20" },
  ],
  cardio: [
    { id: "burpees", baseSets: 3, baseReps: "10-15" },
    { id: "jumping_jacks", baseSets: 3, baseReps: "30-45s" },
    { id: "saltos_cuerda", baseSets: 3, baseReps: "60s" },
  ],
  trapecios: [
    { id: "encogimientos", baseSets: 3, baseReps: "12-15" },
  ],
  antebrazos: [
    { id: "curl_muneca", baseSets: 3, baseReps: "15-20" },
  ],
};

export function generateWorkoutPlan(
  level: TrainingLevel,
  goal: TrainingGoal,
  selectedExerciseIds: string[],
  durationMinutes: number
): WorkoutDay[] {
  const config = LEVEL_CONFIG[level];
  const goalAdjust = GOAL_ADJUSTMENTS[goal];

  const daysPerWeek = config.daysPerWeek;
  const split = WORKOUT_SPLITS[daysPerWeek as keyof typeof WORKOUT_SPLITS] || WORKOUT_SPLITS[4];

  const workoutDays: WorkoutDay[] = [];

  for (let i = 0; i < 7; i++) {
    const dayTemplate = split[i];

    if (dayTemplate.restDay) {
      workoutDays.push({
        dayNumber: i + 1,
        name: dayTemplate.name,
        muscleGroups: [],
        exercises: [],
        duration: 0,
        restDay: true,
      });
      continue;
    }

    const exercises: WorkoutExercise[] = [];
    const targetExercisesPerDay = Math.floor(durationMinutes / 8); // ~8 min por ejercicio

    for (const muscle of dayTemplate.muscleGroups) {
      const muscleExercises = EXERCISES_BY_MUSCLE[muscle] || [];
      const availableExercises = muscleExercises.filter(
        (ex) => selectedExerciseIds.length === 0 || selectedExerciseIds.includes(ex.id)
      );

      // Tomar 1-2 ejercicios por grupo muscular
      const exercisesToAdd = availableExercises.slice(0, 2);

      for (const ex of exercisesToAdd) {
        if (exercises.length >= targetExercisesPerDay) break;

        const adjustedSets = Math.max(
          2,
          Math.round(ex.baseSets * config.setsMultiplier + goalAdjust.setsAdjust)
        );
        const restTime = Math.max(30, config.restSeconds + goalAdjust.restAdjust);

        exercises.push({
          exerciseId: ex.id,
          sets: adjustedSets,
          reps: ex.baseReps,
          rest: `${restTime}s`,
          notes: getExerciseNotes(ex.id, level),
        });
      }
    }

    workoutDays.push({
      dayNumber: i + 1,
      name: dayTemplate.name,
      muscleGroups: dayTemplate.muscleGroups,
      exercises,
      duration: exercises.length * 8,
      restDay: false,
    });
  }

  return workoutDays;
}

function getExerciseNotes(exerciseId: string, level: TrainingLevel): string {
  const notes: Record<string, Record<TrainingLevel, string>> = {
    sentadilla: {
      principiante: "Baja hasta que los muslos queden paralelos al suelo",
      basico: "Controla el descenso, explota en la subida",
      intermedio: "Pausa de 1s en el punto mas bajo",
      avanzado: "Tempo 3-1-1 (baja-pausa-sube)",
      elite: "ATG (hasta abajo) con tempo controlado",
    },
    peso_muerto: {
      principiante: "Mantén la espalda recta, usa espejo para verificar",
      basico: "Empuja el suelo con los pies, no tires con la espalda",
      intermedio: "Activa core antes de cada repeticion",
      avanzado: "Usa cinturon en series pesadas",
      elite: "Deficit o rack pulls para variacion",
    },
    press_banca: {
      principiante: "Baja la barra al pecho con control",
      basico: "Retrae escapulas, arquea levemente la espalda",
      intermedio: "Leg drive activo, toca el pecho",
      avanzado: "Pausa en el pecho 1-2s",
      elite: "Trabajo con cadenas o bandas",
    },
    dominadas: {
      principiante: "Usa banda de asistencia si es necesario",
      basico: "Baja completamente en cada rep",
      intermedio: "Controla el negativo 3s",
      avanzado: "Añade peso con cinturon",
      elite: "One arm negatives o muscle ups",
    },
  };

  return notes[exerciseId]?.[level] || "Ejecuta con buena tecnica";
}

export function getVideoUrl(exerciseId: string): string | undefined {
  return EXERCISE_VIDEOS[exerciseId];
}
