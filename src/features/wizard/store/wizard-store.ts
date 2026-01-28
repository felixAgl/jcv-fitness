import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  WizardState,
  TrainingLevel,
  TrainingGoal,
  EquipmentType,
  ProgramDuration,
  UserBodyData,
} from "../types";

interface WizardActions {
  setLevel: (level: TrainingLevel) => void;
  setGoal: (goal: TrainingGoal) => void;
  setTime: (time: number) => void;
  toggleEquipment: (equipment: EquipmentType) => void;
  setDuration: (duration: ProgramDuration) => void;
  toggleExercise: (exerciseId: string) => void;
  setSelectedExercises: (exercises: string[]) => void;
  toggleFood: (foodId: string) => void;
  setSelectedFoods: (foods: string[]) => void;
  setUserName: (name: string) => void;
  setUserBodyData: (data: UserBodyData) => void;
  updateBodyDataField: <K extends keyof UserBodyData>(field: K, value: UserBodyData[K]) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  reset: () => void;
  canProceed: () => boolean;
  calculateCalories: () => { bmr: number; tdee: number; target: number } | null;
}

const initialBodyData: UserBodyData = {
  currentWeight: 70,
  targetWeight: 70,
  height: 170,
  age: 25,
  gender: "masculino",
  activityLevel: "moderado",
  weightGoal: "mantener",
};

const initialState: WizardState = {
  currentStep: 1,
  level: null,
  goal: null,
  time: 30,
  equipment: [],
  duration: null,
  selectedExercises: [],
  selectedFoods: [],
  userName: "",
  userBodyData: null,
};

const ACTIVITY_MULTIPLIERS = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  activo: 1.725,
  muy_activo: 1.9,
} as const;

export const useWizardStore = create<WizardState & WizardActions>()(
  persist(
    (set, get) => ({
  ...initialState,

  setLevel: (level) => set({ level }),

  setGoal: (goal) => set({ goal }),

  setTime: (time) => set({ time }),

  toggleEquipment: (equipment) =>
    set((state) => {
      const exists = state.equipment.includes(equipment);
      if (exists) {
        const filtered = state.equipment.filter((e) => e !== equipment);
        return { equipment: filtered };
      }
      return { equipment: [...state.equipment, equipment] };
    }),

  setDuration: (duration) => set({ duration }),

  toggleExercise: (exerciseId) =>
    set((state) => {
      const exists = state.selectedExercises.includes(exerciseId);
      if (exists) {
        return {
          selectedExercises: state.selectedExercises.filter((e) => e !== exerciseId),
        };
      }
      return {
        selectedExercises: [...state.selectedExercises, exerciseId],
      };
    }),

  setSelectedExercises: (exercises) => set({ selectedExercises: exercises }),

  toggleFood: (foodId) =>
    set((state) => {
      const exists = state.selectedFoods.includes(foodId);
      if (exists) {
        return {
          selectedFoods: state.selectedFoods.filter((f) => f !== foodId),
        };
      }
      return {
        selectedFoods: [...state.selectedFoods, foodId],
      };
    }),

  setSelectedFoods: (foods) => set({ selectedFoods: foods }),

  setUserName: (userName) => set({ userName }),

  setUserBodyData: (data) => set({ userBodyData: data }),

  updateBodyDataField: (field, value) =>
    set((state) => ({
      userBodyData: state.userBodyData
        ? { ...state.userBodyData, [field]: value }
        : { ...initialBodyData, [field]: value },
    })),

  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, 9),
    })),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 1),
    })),

  goToStep: (step) => set({ currentStep: Math.max(1, Math.min(step, 9)) }),

  reset: () => set(initialState),

  canProceed: () => {
    const state = get();
    switch (state.currentStep) {
      case 1:
        return state.level !== null;
      case 2:
        return state.goal !== null;
      case 3:
        return state.time > 0;
      case 4:
        return state.equipment.length > 0;
      case 5:
        return state.duration !== null;
      case 6:
        return state.userBodyData !== null &&
               state.userBodyData.currentWeight > 0 &&
               state.userBodyData.height > 0 &&
               state.userBodyData.age > 0;
      case 7:
        return true;
      case 8:
        return true;
      case 9:
        return true;
      default:
        return false;
    }
  },

  calculateCalories: () => {
    const { userBodyData } = get();
    if (!userBodyData) return null;

    const { currentWeight, height, age, gender, activityLevel, weightGoal } = userBodyData;

    // Harris-Benedict BMR formula (GEB)
    // Hombres: GEB = 66.5 + (13.75 x peso) + (5.003 x altura) - (6.755 x edad)
    // Mujeres: GEB = 655.1 + (9.563 x peso) + (1.850 x altura) - (4.676 x edad)
    let bmr: number;
    if (gender === "masculino") {
      bmr = 66.5 + (13.75 * currentWeight) + (5.003 * height) - (6.755 * age);
    } else {
      bmr = 655.1 + (9.563 * currentWeight) + (1.850 * height) - (4.676 * age);
    }

    const tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel];

    let target: number;
    switch (weightGoal) {
      case "perder":
        target = tdee - 500; // Deficit de 500 cal para perder ~0.5kg/semana
        break;
      case "ganar":
        target = tdee + 300; // Superavit de 300 cal para ganar masa limpia
        break;
      default:
        target = tdee;
    }

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      target: Math.round(target),
    };
  },
}),
    {
      name: "jcv-wizard-state",
      partialize: (state) => ({
        currentStep: state.currentStep,
        level: state.level,
        goal: state.goal,
        time: state.time,
        equipment: state.equipment,
        duration: state.duration,
        selectedExercises: state.selectedExercises,
        selectedFoods: state.selectedFoods,
        userName: state.userName,
        userBodyData: state.userBodyData,
      }),
    }
  )
);
