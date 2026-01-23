export type TrainingLevel =
  | "principiante"
  | "basico"
  | "intermedio"
  | "avanzado"
  | "elite";

export type TrainingGoal =
  | "perder_grasa"
  | "ganar_musculo"
  | "tonificar"
  | "resistencia"
  | "flexibilidad"
  | "fuerza"
  | "energia"
  | "salud";

export type EquipmentType =
  | "sin_equipo"
  | "mancuernas"
  | "bandas"
  | "barra"
  | "banco"
  | "pull_up_bar"
  | "kettlebell"
  | "maquinas"
  | "trx"
  | "step"
  | "pelota"
  | "cuerda";

export type ProgramDuration =
  | "1_dia"
  | "3_dias"
  | "1_semana"
  | "2_semanas"
  | "1_mes"
  | "6_semanas"
  | "2_meses"
  | "3_meses";

export type ExerciseCategory =
  | "piernas"
  | "pecho"
  | "espalda"
  | "brazos"
  | "core"
  | "cardio"
  | "cuerpo_completo";

export interface Exercise {
  id: string;
  name: string;
  altName: string;
  techName: string;
  emoji: string;
  category: ExerciseCategory;
  muscle: string;
  equipment: EquipmentType[];
  videoUrl?: string;
  instructions?: string[];
  sets?: { min: number; max: number };
  reps?: { min: number; max: number };
  restSeconds?: number;
}

export interface MealPlanDay {
  dayNumber: number;
  meals: Meal[];
  totalCalories: number;
  macros: { protein: number; carbs: number; fat: number };
}

export interface Meal {
  name: string;
  time: string;
  foods: MealFood[];
  calories: number;
}

export interface MealFood {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface WorkoutDay {
  dayNumber: number;
  name: string;
  muscleGroups: string[];
  exercises: WorkoutExercise[];
  duration: number;
  restDay: boolean;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
}

export type WeightGoal = "perder" | "mantener" | "ganar";

export type ActivityLevel = "sedentario" | "ligero" | "moderado" | "activo" | "muy_activo";

export interface UserBodyData {
  currentWeight: number;
  targetWeight: number;
  height: number;
  age: number;
  gender: "masculino" | "femenino";
  activityLevel: ActivityLevel;
  weightGoal: WeightGoal;
}

export interface WizardState {
  currentStep: number;
  level: TrainingLevel | null;
  goal: TrainingGoal | null;
  time: number;
  equipment: EquipmentType[];
  duration: ProgramDuration | null;
  selectedExercises: string[];
  userName: string;
  userBodyData: UserBodyData | null;
}

export interface LevelOption {
  value: TrainingLevel;
  label: string;
  subtitle: string;
  description: string;
  color: string;
}

export interface GoalOption {
  value: TrainingGoal;
  label: string;
  emoji: string;
  description: string;
  color: string;
}

export interface EquipmentOption {
  value: EquipmentType;
  label: string;
  emoji: string;
  description: string;
}

export interface DurationOption {
  value: ProgramDuration;
  label: string;
  description: string;
}

export const ACTIVITY_LEVELS: Array<{ value: ActivityLevel; label: string; description: string }> = [
  { value: "sedentario", label: "Sedentario", description: "Trabajo de oficina, poco movimiento" },
  { value: "ligero", label: "Ligero", description: "Ejercicio 1-2 veces/semana" },
  { value: "moderado", label: "Moderado", description: "Ejercicio 3-4 veces/semana" },
  { value: "activo", label: "Activo", description: "Ejercicio 5-6 veces/semana" },
  { value: "muy_activo", label: "Muy Activo", description: "Atleta o trabajo fisico intenso" },
];

export const WEIGHT_GOALS: Array<{ value: WeightGoal; label: string; emoji: string }> = [
  { value: "perder", label: "Perder Peso", emoji: "📉" },
  { value: "mantener", label: "Mantener Peso", emoji: "⚖️" },
  { value: "ganar", label: "Ganar Masa", emoji: "📈" },
];

export const TRANSLATIONS = {
  levels: {
    principiante: "Principiante",
    basico: "Basico",
    intermedio: "Intermedio",
    avanzado: "Avanzado",
    elite: "Elite",
  },
  goals: {
    perder_grasa: "Quemar Grasa",
    ganar_musculo: "Ganar Musculo",
    tonificar: "Tonificar",
    resistencia: "Resistencia",
    flexibilidad: "Flexibilidad",
    fuerza: "Fuerza Pura",
    energia: "Mas Energia",
    salud: "Salud General",
  },
  durations: {
    "1_dia": "1 Dia",
    "3_dias": "3 Dias",
    "1_semana": "1 Semana",
    "2_semanas": "2 Semanas",
    "1_mes": "1 Mes",
    "6_semanas": "6 Semanas",
    "2_meses": "2 Meses",
    "3_meses": "3 Meses",
  },
  equipment: {
    sin_equipo: "Sin Equipo",
    mancuernas: "Mancuernas",
    bandas: "Bandas",
    barra: "Barra",
    banco: "Banco",
    pull_up_bar: "Barra Dominadas",
    kettlebell: "Kettlebell",
    maquinas: "Maquinas",
    trx: "TRX",
    step: "Step/Cajon",
    pelota: "Balon Medicinal",
    cuerda: "Cuerda",
  },
  categories: {
    piernas: "Piernas",
    pecho: "Pecho",
    espalda: "Espalda",
    brazos: "Brazos",
    core: "Core",
    cardio: "Cardio",
    cuerpo_completo: "Cuerpo Completo",
  },
} as const;
