import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExerciseMediaThumb } from "../ExerciseMediaThumb";
import type { LibraryExercise } from "@/features/exercises";

// Mock exercise media: only "sentadilla" has media
vi.mock("@/features/wizard/data/exercise-media", () => ({
  EXERCISE_MEDIA: {},
  getExerciseMedia: (exerciseId: string) =>
    exerciseId === "sentadilla"
      ? {
          image: "https://example.com/images/0043-qXTaZnJ.jpg",
          gif: "https://example.com/videos/0043-qXTaZnJ.gif",
        }
      : undefined,
}));

const libraryFixture: LibraryExercise[] = [
  {
    id: "0043",
    name: "barbell full squat",
    category: "upper legs",
    body_part: "upper legs",
    equipment: "barbell",
    target: "quads",
    secondary_muscles: ["glutes", "hamstrings"],
    instructions: { es: "Baja en sentadilla.", en: "Squat down." },
    instruction_steps: {
      es: ["Coloca la barra sobre los trapecios.", "Baja hasta la paralela."],
      en: ["Place the bar on your traps.", "Squat down to parallel."],
    },
    image: "images/0043-qXTaZnJ.jpg",
    gif: "videos/0043-qXTaZnJ.gif",
  },
];

// Keep pure helpers real; only stub the network loader used by the modal.
vi.mock("@/features/exercises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/exercises")>();
  return {
    ...actual,
    loadExerciseLibrary: vi.fn(() => Promise.resolve(libraryFixture)),
  };
});

describe("ExerciseMediaThumb", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("should render emoji fallback when exercise has no media", () => {
    render(<ExerciseMediaThumb exerciseId="sin_media" emoji="🦵" name="Sentadillas" />);

    expect(screen.getByText("🦵")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("should render default emoji when no media and no emoji provided", () => {
    render(<ExerciseMediaThumb exerciseId="sin_media" />);

    expect(screen.getByText("🏋️")).toBeInTheDocument();
  });

  it("should render thumbnail image with a play badge when media exists", () => {
    render(<ExerciseMediaThumb exerciseId="sentadilla" emoji="🦵" name="Sentadillas" />);

    const img = screen.getByRole("img", { name: "Sentadillas" });
    expect(img).toHaveAttribute("src", "https://example.com/images/0043-qXTaZnJ.jpg");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(screen.getByRole("button", { name: "Ver demostracion de Sentadillas" })).toBeInTheDocument();
  });

  it("should fall back to the emoji circle when the thumbnail image fails to load", () => {
    render(<ExerciseMediaThumb exerciseId="sentadilla" emoji="🦵" name="Sentadillas" />);

    fireEvent.error(screen.getByRole("img", { name: "Sentadillas" }));

    expect(screen.getByText("🦵")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("should open the detail modal on click", async () => {
    const user = userEvent.setup();
    render(<ExerciseMediaThumb exerciseId="sentadilla" emoji="🦵" name="Sentadillas" />);

    await user.click(screen.getByRole("button", { name: "Ver demostracion de Sentadillas" }));

    const dialog = await screen.findByRole("dialog", { name: "Sentadillas" });
    expect(dialog).toBeInTheDocument();
  });

  it("should close the modal with the X button", async () => {
    const user = userEvent.setup();
    render(<ExerciseMediaThumb exerciseId="sentadilla" name="Sentadillas" />);

    await user.click(screen.getByRole("button", { name: "Ver demostracion de Sentadillas" }));
    await screen.findByRole("dialog");

    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should close the modal with Escape", async () => {
    const user = userEvent.setup();
    render(<ExerciseMediaThumb exerciseId="sentadilla" name="Sentadillas" />);

    await user.click(screen.getByRole("button", { name: "Ver demostracion de Sentadillas" }));
    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should close the modal by clicking the backdrop", async () => {
    const user = userEvent.setup();
    render(<ExerciseMediaThumb exerciseId="sentadilla" name="Sentadillas" />);

    await user.click(screen.getByRole("button", { name: "Ver demostracion de Sentadillas" }));
    await screen.findByRole("dialog");

    await user.click(screen.getByTestId("exercise-modal-backdrop"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
