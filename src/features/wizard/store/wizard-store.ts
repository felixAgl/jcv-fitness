import { create } from "zustand";
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
  equipment: ["sin_equipo"],
  duration: null,
  selectedExercises: [],
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

export const useWizardStore = create<WizardState & WizardActions>((set, get) => ({
  ...initialState,

  setLevel: (level) => set({ level }),

  setGoal: (goal) => set({ goal }),

  setTime: (time) => set({ time }),

  toggleEquipment: (equipment) =>
    set((state) => {
      const exists = state.equipment.includes(equipment);
      if (exists) {
        const filtered = state.equipment.filter((e) => e !== equipment);
        return { equipment: filtered.length > 0 ? filtered : ["sin_equipo"] };
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
      currentStep: Math.min(state.currentStep + 1, 8),
    })),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 1),
    })),

  goToStep: (step) => set({ currentStep: Math.max(1, Math.min(step, 8)) }),

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
      default:
        return false;
    }
  },

  calculateCalories: () => {
    const { userBodyData } = get();
    if (!userBodyData) return null;

    const { currentWeight, height, age, gender, activityLevel, weightGoal } = userBodyData;

    // Harris-Benedict BMR formula
    let bmr: number;
    if (gender === "masculino") {
      bmr = 88.362 + (13.397 * currentWeight) + (4.799 * height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * currentWeight) + (3.098 * height) - (4.330 * age);
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
}));
