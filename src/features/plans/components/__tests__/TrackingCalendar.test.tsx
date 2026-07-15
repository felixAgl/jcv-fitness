import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { TrackingCalendar } from "../TrackingCalendar";
import type { PlanProgress, PlanDataWithProgress } from "../../types";
import type { WorkoutDay } from "@/features/wizard/types";

const today = new Date().toISOString().split("T")[0];

const mockToggleWorkout = vi.fn();

vi.mock("../../services/progress-service", () => ({
  progressService: {
    toggleWorkoutCompleted: (...args: unknown[]) => mockToggleWorkout(...args),
    toggleMealsTracked: vi.fn(),
    initializeProgressIfNeeded: vi.fn(),
  },
  initializePlanProgress: vi.fn(),
}));

function buildProgress({ completed = false, total = 0 }: { completed?: boolean; total?: number } = {}): PlanProgress {
  return {
    totalWeeks: 4,
    currentWeek: 1,
    weeks: [
      {
        weekNumber: 1,
        startDate: today,
        endDate: today,
        days: {
          [today]: {
            date: today,
            workoutCompleted: completed,
            mealsTracked: false,
          },
        },
      },
    ],
    stats: {
      totalWorkoutsCompleted: total,
      totalWorkoutsPlanned: 20,
      currentStreak: total,
      longestStreak: total,
      completionRate: 0,
    },
  };
}

// Every weekday is a training day so "today" is always toggleable.
const workoutPlan: WorkoutDay[] = Array.from({ length: 7 }, (_, i) => ({
  dayNumber: i + 1,
  name: `Dia ${i + 1}`,
  restDay: false,
  duration: 45,
  muscleGroups: ["pecho"],
  exercises: [],
})) as WorkoutDay[];

function renderCalendar(initialProgress: PlanProgress = buildProgress()) {
  return render(
    <TrackingCalendar
      planId="plan-1"
      planData={{ progress: initialProgress } as PlanDataWithProgress}
      workoutPlan={workoutPlan}
      planStartDate={new Date()}
      daysRemaining={20}
    />
  );
}

describe("TrackingCalendar celebration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockToggleWorkout.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the ring celebration when a day is marked complete", async () => {
    mockToggleWorkout.mockResolvedValue(buildProgress({ completed: true, total: 1 }));
    renderCalendar();
    await act(async () => {}); // flush initial load

    fireEvent.click(screen.getByText("Marcar como Completado"));
    await act(async () => {}); // flush the toggle promise

    expect(screen.getByTestId("day-celebration")).toBeInTheDocument();
    // No milestone at 1 completed workout
    expect(screen.queryByTestId("milestone-overlay")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1700);
    });
    expect(screen.queryByTestId("day-celebration")).not.toBeInTheDocument();
  });

  it("shows the milestone overlay at 7 completed workouts and auto-dismisses", async () => {
    mockToggleWorkout.mockResolvedValue(buildProgress({ completed: true, total: 7 }));
    renderCalendar();
    await act(async () => {});

    fireEvent.click(screen.getByText("Marcar como Completado"));
    await act(async () => {});

    expect(screen.getByTestId("milestone-overlay")).toBeInTheDocument();
    expect(screen.getByText("7 DIAS")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2600);
    });
    expect(screen.queryByTestId("milestone-overlay")).not.toBeInTheDocument();
  });

  it("dismisses the milestone overlay on tap", async () => {
    mockToggleWorkout.mockResolvedValue(buildProgress({ completed: true, total: 20 }));
    renderCalendar();
    await act(async () => {});

    fireEvent.click(screen.getByText("Marcar como Completado"));
    await act(async () => {});

    expect(screen.getByText("20 DIAS")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("milestone-overlay"));
    expect(screen.queryByTestId("milestone-overlay")).not.toBeInTheDocument();
  });

  it("does not celebrate when a day is un-marked", async () => {
    mockToggleWorkout.mockResolvedValue(buildProgress({ completed: false, total: 0 }));
    renderCalendar(buildProgress({ completed: true, total: 1 }));
    await act(async () => {});

    fireEvent.click(screen.getByText("Completado!"));
    await act(async () => {});

    expect(screen.queryByTestId("day-celebration")).not.toBeInTheDocument();
    expect(screen.queryByTestId("milestone-overlay")).not.toBeInTheDocument();
  });
});
