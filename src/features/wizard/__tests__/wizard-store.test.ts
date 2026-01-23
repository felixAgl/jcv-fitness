import { describe, it, expect, beforeEach } from "vitest";
import { useWizardStore } from "../store/wizard-store";

describe("Wizard Store", () => {
  beforeEach(() => {
    useWizardStore.getState().reset();
  });

  describe("Initial State", () => {
    it("should have correct initial values", () => {
      const state = useWizardStore.getState();
      expect(state.currentStep).toBe(1);
      expect(state.level).toBeNull();
      expect(state.goal).toBeNull();
      expect(state.time).toBe(30);
      expect(state.equipment).toEqual(["sin_equipo"]);
      expect(state.duration).toBeNull();
      expect(state.selectedExercises).toEqual([]);
      expect(state.userName).toBe("");
      expect(state.userBodyData).toBeNull();
    });
  });

  describe("Level Selection", () => {
    it("should set training level", () => {
      useWizardStore.getState().setLevel("intermedio");
      expect(useWizardStore.getState().level).toBe("intermedio");
    });
  });

  describe("Goal Selection", () => {
    it("should set training goal", () => {
      useWizardStore.getState().setGoal("perder_grasa");
      expect(useWizardStore.getState().goal).toBe("perder_grasa");
    });
  });

  describe("Time Selection", () => {
    it("should set training time", () => {
      useWizardStore.getState().setTime(45);
      expect(useWizardStore.getState().time).toBe(45);
    });
  });

  describe("Equipment Toggle", () => {
    it("should add equipment", () => {
      useWizardStore.getState().toggleEquipment("mancuernas");
      expect(useWizardStore.getState().equipment).toContain("mancuernas");
    });

    it("should remove equipment when toggled again", () => {
      useWizardStore.getState().toggleEquipment("mancuernas");
      useWizardStore.getState().toggleEquipment("mancuernas");
      expect(useWizardStore.getState().equipment).not.toContain("mancuernas");
    });

    it("should keep sin_equipo when all removed", () => {
      useWizardStore.getState().toggleEquipment("sin_equipo");
      expect(useWizardStore.getState().equipment).toEqual(["sin_equipo"]);
    });
  });

  describe("Duration Selection", () => {
    it("should set program duration", () => {
      useWizardStore.getState().setDuration("1_mes");
      expect(useWizardStore.getState().duration).toBe("1_mes");
    });
  });

  describe("Exercise Toggle", () => {
    it("should add exercise", () => {
      useWizardStore.getState().toggleExercise("sentadilla");
      expect(useWizardStore.getState().selectedExercises).toContain("sentadilla");
    });

    it("should remove exercise when toggled again", () => {
      useWizardStore.getState().toggleExercise("sentadilla");
      useWizardStore.getState().toggleExercise("sentadilla");
      expect(useWizardStore.getState().selectedExercises).not.toContain("sentadilla");
    });
  });

  describe("Navigation", () => {
    it("should go to next step", () => {
      useWizardStore.getState().nextStep();
      expect(useWizardStore.getState().currentStep).toBe(2);
    });

    it("should go to previous step", () => {
      useWizardStore.getState().nextStep();
      useWizardStore.getState().nextStep();
      useWizardStore.getState().prevStep();
      expect(useWizardStore.getState().currentStep).toBe(2);
    });

    it("should not go below step 1", () => {
      useWizardStore.getState().prevStep();
      expect(useWizardStore.getState().currentStep).toBe(1);
    });

    it("should not go above step 8", () => {
      for (let i = 0; i < 10; i++) {
        useWizardStore.getState().nextStep();
      }
      expect(useWizardStore.getState().currentStep).toBe(8);
    });

    it("should go to specific step", () => {
      useWizardStore.getState().goToStep(5);
      expect(useWizardStore.getState().currentStep).toBe(5);
    });
  });

  describe("Can Proceed Validation", () => {
    it("should not proceed on step 1 without level", () => {
      expect(useWizardStore.getState().canProceed()).toBe(false);
    });

    it("should proceed on step 1 with level", () => {
      useWizardStore.getState().setLevel("principiante");
      expect(useWizardStore.getState().canProceed()).toBe(true);
    });

    it("should not proceed on step 2 without goal", () => {
      useWizardStore.getState().setLevel("principiante");
      useWizardStore.getState().nextStep();
      expect(useWizardStore.getState().canProceed()).toBe(false);
    });

    it("should proceed on step 2 with goal", () => {
      useWizardStore.getState().setLevel("principiante");
      useWizardStore.getState().nextStep();
      useWizardStore.getState().setGoal("perder_grasa");
      expect(useWizardStore.getState().canProceed()).toBe(true);
    });
  });

  describe("Body Data", () => {
    it("should update body data field", () => {
      useWizardStore.getState().updateBodyDataField("currentWeight", 80);
      expect(useWizardStore.getState().userBodyData?.currentWeight).toBe(80);
    });

    it("should set complete body data", () => {
      const bodyData = {
        currentWeight: 75,
        targetWeight: 70,
        height: 175,
        age: 30,
        gender: "masculino" as const,
        activityLevel: "activo" as const,
        weightGoal: "perder" as const,
      };
      useWizardStore.getState().setUserBodyData(bodyData);
      expect(useWizardStore.getState().userBodyData).toEqual(bodyData);
    });
  });

  describe("Calorie Calculation", () => {
    it("should calculate calories for male", () => {
      useWizardStore.getState().setUserBodyData({
        currentWeight: 80,
        targetWeight: 75,
        height: 180,
        age: 25,
        gender: "masculino",
        activityLevel: "moderado",
        weightGoal: "perder",
      });

      const calories = useWizardStore.getState().calculateCalories();
      expect(calories).not.toBeNull();
      expect(calories!.bmr).toBeGreaterThan(1500);
      expect(calories!.tdee).toBeGreaterThan(calories!.bmr);
      expect(calories!.target).toBeLessThan(calories!.tdee);
    });

    it("should calculate calories for female", () => {
      useWizardStore.getState().setUserBodyData({
        currentWeight: 60,
        targetWeight: 65,
        height: 165,
        age: 28,
        gender: "femenino",
        activityLevel: "ligero",
        weightGoal: "ganar",
      });

      const calories = useWizardStore.getState().calculateCalories();
      expect(calories).not.toBeNull();
      expect(calories!.bmr).toBeGreaterThan(1200);
      expect(calories!.target).toBeGreaterThan(calories!.tdee);
    });

    it("should return null without body data", () => {
      const calories = useWizardStore.getState().calculateCalories();
      expect(calories).toBeNull();
    });
  });

  describe("Reset", () => {
    it("should reset to initial state", () => {
      useWizardStore.getState().setLevel("avanzado");
      useWizardStore.getState().setGoal("ganar_musculo");
      useWizardStore.getState().nextStep();
      useWizardStore.getState().nextStep();

      useWizardStore.getState().reset();

      const state = useWizardStore.getState();
      expect(state.currentStep).toBe(1);
      expect(state.level).toBeNull();
      expect(state.goal).toBeNull();
    });
  });
});
