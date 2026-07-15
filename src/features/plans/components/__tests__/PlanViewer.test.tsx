import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlanViewer } from "../PlanViewer";
import { createMockProfile } from "@/test/mocks/supabase";

// Mock next/navigation
const mockBack = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: mockBack,
    push: vi.fn(),
  }),
}));

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock("@/features/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock workout/meal generators
vi.mock("@/features/wizard/data/workout-templates", () => ({
  generateWorkoutPlan: vi.fn(() => [
    {
      name: "Dia 1 - Pecho y Triceps",
      restDay: false,
      duration: 45,
      muscleGroups: ["pecho", "triceps"],
      exercises: [
        { exerciseId: "bench_press", sets: 4, reps: "8-10", rest: "90s", notes: "Controlar el movimiento" },
        { exerciseId: "incline_press", sets: 3, reps: "10-12", rest: "60s", notes: "Ejecuta con buena tecnica" },
      ],
    },
    {
      name: "Dia 2 - Descanso",
      restDay: true,
      duration: 0,
      muscleGroups: [],
      exercises: [],
    },
    {
      name: "Dia 3 - Espalda y Biceps",
      restDay: false,
      duration: 50,
      muscleGroups: ["espalda", "biceps"],
      exercises: [
        { exerciseId: "pull_ups", sets: 4, reps: "8-10", rest: "90s" },
      ],
    },
    { name: "Dia 4 - Descanso", restDay: true, duration: 0, muscleGroups: [], exercises: [] },
    { name: "Dia 5 - Piernas", restDay: false, duration: 60, muscleGroups: ["cuadriceps", "gluteos"], exercises: [] },
    { name: "Dia 6 - Descanso", restDay: true, duration: 0, muscleGroups: [], exercises: [] },
    { name: "Dia 7 - Descanso", restDay: true, duration: 0, muscleGroups: [], exercises: [] },
  ]),
}));

vi.mock("@/features/wizard/data/meal-templates", () => ({
  generateMealPlan: vi.fn(() => [
    {
      totalCalories: 2200,
      macros: { protein: 150, carbs: 220, fat: 70 },
      meals: [
        {
          name: "Desayuno",
          time: "7:00 AM",
          calories: 500,
          foods: [
            { name: "Huevos", portion: "3 unidades", calories: 210, protein: 18, carbs: 1, fat: 15 },
            { name: "Avena", portion: "50g", calories: 190, protein: 7, carbs: 34, fat: 4 },
          ],
        },
        {
          name: "Almuerzo",
          time: "12:00 PM",
          calories: 700,
          foods: [
            { name: "Pollo", portion: "150g", calories: 250, protein: 45, carbs: 0, fat: 6 },
          ],
        },
      ],
    },
  ]),
}));

// Mock exercises and foods data
vi.mock("@/features/wizard/data/exercises", () => ({
  exercises: [
    { id: "bench_press", name: "Press de Banca", emoji: "🏋️", altName: "Bench Press" },
    { id: "incline_press", name: "Press Inclinado", emoji: "🔥" },
    { id: "pull_ups", name: "Dominadas", emoji: "💪" },
  ],
}));

// Mock exercise media (no media -> emoji fallback, current behavior)
vi.mock("@/features/wizard/data/exercise-media", () => ({
  EXERCISE_MEDIA: {},
  getExerciseMedia: () => undefined,
}));

vi.mock("@/features/wizard/data/foods", () => ({
  foods: [
    { id: "chicken", name: "Pollo" },
    { id: "rice", name: "Arroz" },
    { id: "eggs", name: "Huevos" },
  ],
}));

// Create mock plan
const createMockPlan = (overrides = {}) => ({
  id: "plan-123",
  userId: "user-123",
  planType: "paid" as const,
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  isActive: true,
  isExpired: false,
  daysRemaining: 30,
  downloadCount: 0,
  updatedAt: new Date(),
  planData: {
    currentStep: 9,
    userName: "Juan",
    level: "intermedio" as const,
    goal: "ganar_musculo" as const,
    duration: "3_meses" as const,
    time: 60,
    equipment: ["mancuernas", "barra"] as ("mancuernas" | "barra")[],
    selectedExercises: ["bench_press", "pull_ups"],
    selectedFoods: ["chicken", "rice"],
    userBodyData: {
      currentWeight: 75,
      targetWeight: 80,
      height: 175,
      age: 28,
      gender: "masculino" as const,
      activityLevel: "moderado" as const,
      weightGoal: "ganar" as const,
    },
  },
  ...overrides,
});

describe("PlanViewer", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    mockUseAuth.mockReturnValue({
      profile: createMockProfile({ has_active_subscription: true }),
    });
  });

  describe("Header", () => {
    it("should render plan title with user name", () => {
      render(<PlanViewer plan={createMockPlan()} />);

      expect(screen.getByText("Plan de Juan")).toBeInTheDocument();
    });

    it("should show days remaining", () => {
      render(<PlanViewer plan={createMockPlan({ daysRemaining: 30 })} />);

      expect(screen.getByText("30 dias")).toBeInTheDocument();
    });

    it("should navigate back when back button clicked", async () => {
      render(<PlanViewer plan={createMockPlan()} />);

      await user.click(screen.getByText("Volver"));

      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe("Expiration Warning", () => {
    it("should show warning when plan expires in 7 days or less", () => {
      render(<PlanViewer plan={createMockPlan({ daysRemaining: 5, isExpired: false })} />);

      expect(screen.getByText(/Tu plan vence en 5 dias/)).toBeInTheDocument();
      expect(screen.getByText("Renovar")).toBeInTheDocument();
    });

    it("should not show warning when more than 7 days remaining", () => {
      render(<PlanViewer plan={createMockPlan({ daysRemaining: 15 })} />);

      expect(screen.queryByText(/Tu plan vence en/)).not.toBeInTheDocument();
    });
  });

  describe("Tabs", () => {
    it("should render all tabs", () => {
      render(<PlanViewer plan={createMockPlan()} />);

      expect(screen.getByText("Resumen")).toBeInTheDocument();
      expect(screen.getByText("Rutina Semanal")).toBeInTheDocument();
      expect(screen.getByText("Plan Alimenticio")).toBeInTheDocument();
      expect(screen.getByText("Calendario")).toBeInTheDocument();
    });

    it("should switch to Rutina tab when clicked", async () => {
      render(<PlanViewer plan={createMockPlan()} />);

      await user.click(screen.getByText("Rutina Semanal"));

      expect(screen.getByText("Dia 1 - Pecho y Triceps")).toBeInTheDocument();
    });

    it("should switch to Alimentacion tab when clicked", async () => {
      render(<PlanViewer plan={createMockPlan()} />);

      await user.click(screen.getByText("Plan Alimenticio"));

      expect(screen.getByText(/Resumen Nutricional/)).toBeInTheDocument();
    });

    it("should switch to Calendario tab when clicked", async () => {
      render(<PlanViewer plan={createMockPlan()} />);

      await user.click(screen.getByText("Calendario"));

      // TrackingCalendar component shows progress header
      expect(screen.getByText("Tu Progreso")).toBeInTheDocument();
    });
  });

  describe("Resumen Tab", () => {
    it("should show plan configuration", () => {
      render(<PlanViewer plan={createMockPlan()} />);

      expect(screen.getByText("Configuracion del Programa")).toBeInTheDocument();
      expect(screen.getByText("Intermedio")).toBeInTheDocument();
      expect(screen.getByText("Ganar Músculo")).toBeInTheDocument();
      expect(screen.getByText("60 min")).toBeInTheDocument();
    });

    it("should show body data", () => {
      render(<PlanViewer plan={createMockPlan()} />);

      expect(screen.getByText("Datos Corporales")).toBeInTheDocument();
      expect(screen.getByText("75")).toBeInTheDocument(); // current weight
      expect(screen.getByText("80")).toBeInTheDocument(); // target weight
      expect(screen.getByText("175")).toBeInTheDocument(); // height
    });

    it("should show quick stats", () => {
      render(<PlanViewer plan={createMockPlan()} />);

      // Training days count
      expect(screen.getByText("Dias de Entreno")).toBeInTheDocument();
      expect(screen.getByText("Ejercicios")).toBeInTheDocument();
      expect(screen.getByText("Alimentos")).toBeInTheDocument();
    });

    it("should show download CTA when not expired", () => {
      render(<PlanViewer plan={createMockPlan()} />);

      expect(screen.getByText("Descarga tu plan en PDF")).toBeInTheDocument();
    });

    it("should not show download CTA when expired", () => {
      render(<PlanViewer plan={createMockPlan({ isExpired: true })} />);

      expect(screen.queryByText("Descarga tu plan en PDF")).not.toBeInTheDocument();
    });
  });

  describe("Rutina Tab", () => {
    it("should show day selector", async () => {
      render(<PlanViewer plan={createMockPlan()} />);

      await user.click(screen.getByText("Rutina Semanal"));

      expect(screen.getByText("Lunes")).toBeInTheDocument();
      expect(screen.getByText("Martes")).toBeInTheDocument();
    });

    it("should show exercises for selected day", async () => {
      render(<PlanViewer plan={createMockPlan()} />);

      await user.click(screen.getByText("Rutina Semanal"));

      expect(screen.getByText("Press de Banca")).toBeInTheDocument();
      expect(screen.getByText("4×")).toBeInTheDocument();
      expect(screen.getAllByText("series").length).toBeGreaterThan(0);
      expect(screen.getByText("8-10")).toBeInTheDocument();
    });

    it("should show real tips but hide the generic default note", async () => {
      render(<PlanViewer plan={createMockPlan()} />);

      await user.click(screen.getByText("Rutina Semanal"));

      expect(screen.getByText("Tip: Controlar el movimiento")).toBeInTheDocument();
      expect(screen.queryByText(/Ejecuta con buena tecnica/)).not.toBeInTheDocument();
    });

    it("should show rest day content", async () => {
      render(<PlanViewer plan={createMockPlan()} />);

      await user.click(screen.getByText("Rutina Semanal"));

      // Click on day 2 (rest day)
      const dayButtons = screen.getAllByText("Descanso");
      await user.click(dayButtons[0].closest("button")!);

      expect(screen.getByText("Dia de Descanso")).toBeInTheDocument();
    });

    it("should show muscle groups", async () => {
      render(<PlanViewer plan={createMockPlan()} />);

      await user.click(screen.getByText("Rutina Semanal"));

      expect(screen.getByText("Pecho")).toBeInTheDocument();
      expect(screen.getByText("Triceps")).toBeInTheDocument();
    });
  });

  describe("Alimentacion Tab", () => {
    it("should show meal plan", async () => {
      render(<PlanViewer plan={createMockPlan()} />);

      await user.click(screen.getByText("Plan Alimenticio"));

      expect(screen.getByText("2200")).toBeInTheDocument(); // Total calories
      expect(screen.getByText("150g")).toBeInTheDocument(); // Protein
    });

    it("should show individual meals", async () => {
      render(<PlanViewer plan={createMockPlan()} />);

      await user.click(screen.getByText("Plan Alimenticio"));

      expect(screen.getByText("Desayuno")).toBeInTheDocument();
      expect(screen.getByText("Almuerzo")).toBeInTheDocument();
    });

    it("should show foods in meals", async () => {
      render(<PlanViewer plan={createMockPlan()} />);

      await user.click(screen.getByText("Plan Alimenticio"));

      expect(screen.getByText("Huevos")).toBeInTheDocument();
      expect(screen.getByText("(3 unidades)")).toBeInTheDocument();
    });
  });

  describe("Calendario Tab", () => {
    it("should render tracking calendar component", async () => {
      render(<PlanViewer plan={createMockPlan()} />);

      await user.click(screen.getByText("Calendario"));

      // TrackingCalendar shows progress header
      expect(screen.getByText("Tu Progreso")).toBeInTheDocument();
    });

    it("should show progress stats", async () => {
      render(<PlanViewer plan={createMockPlan()} />);

      await user.click(screen.getByText("Calendario"));

      // Stats row shows Entrenos, Completado, Semana, Restantes
      expect(screen.getByText("Entrenos")).toBeInTheDocument();
      // "Completado" appears in multiple places, just verify Entrenos and Semana
      expect(screen.getByText("Semana")).toBeInTheDocument();
    });

    it("should show streak section", async () => {
      render(<PlanViewer plan={createMockPlan()} />);

      await user.click(screen.getByText("Calendario"));

      // Streak section shows best streak
      expect(screen.getByText("Mejor racha")).toBeInTheDocument();
    });
  });

  describe("Modo Gimnasio", () => {
    beforeEach(() => {
      window.localStorage.removeItem("jcv-gym-mode");
    });

    it("should toggle gym mode, persist it, and restore it on a fresh mount", async () => {
      const { unmount } = render(<PlanViewer plan={createMockPlan()} initialTab="rutina" />);

      const toggle = screen.getByRole("button", { name: /Modo Gimnasio/ });
      expect(toggle).toHaveAttribute("aria-pressed", "false");

      await user.click(toggle);

      expect(toggle).toHaveAttribute("aria-pressed", "true");
      expect(window.localStorage.getItem("jcv-gym-mode")).toBe("1");

      unmount();

      // Fresh mount restores the persisted preference
      render(<PlanViewer plan={createMockPlan()} initialTab="rutina" />);
      expect(screen.getByRole("button", { name: /Modo Gimnasio/ })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      window.localStorage.removeItem("jcv-gym-mode");
    });

    it("should show giant numerals and hide tips in gym mode", async () => {
      render(<PlanViewer plan={createMockPlan()} initialTab="rutina" />);

      // Normal mode shows the tip and the compact chips
      expect(screen.getByText("Tip: Controlar el movimiento")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /Modo Gimnasio/ }));

      // One-thumb layout: giant Bebas numerals with uppercase labels
      expect(screen.getAllByText("Series").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Reps").length).toBeGreaterThan(0);
      // Simplified chrome: tips and muscle chips hidden
      expect(screen.queryByText("Tip: Controlar el movimiento")).not.toBeInTheDocument();
      expect(screen.queryByText("Pecho")).not.toBeInTheDocument();
      window.localStorage.removeItem("jcv-gym-mode");
    });
  });

  describe("Subscription Status", () => {
    it("should show PDF download button when has subscription", () => {
      mockUseAuth.mockReturnValue({
        profile: createMockProfile({ has_active_subscription: true }),
      });

      render(<PlanViewer plan={createMockPlan()} />);

      expect(screen.getByText("Descargar PDF")).toBeInTheDocument();
    });

    it("should show upgrade CTA when no subscription", () => {
      mockUseAuth.mockReturnValue({
        profile: createMockProfile({ has_active_subscription: false }),
      });

      render(<PlanViewer plan={createMockPlan()} />);

      expect(screen.getByText("Ver Planes Premium")).toBeInTheDocument();
    });
  });
});
