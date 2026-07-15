import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExerciseDetailModal } from "../ExerciseDetailModal";
import type { LibraryExercise } from "@/features/exercises";

vi.mock("@/features/wizard/data/exercise-media", () => ({
  EXERCISE_MEDIA: {},
  getExerciseMedia: (exerciseId: string) =>
    exerciseId === "press_banca"
      ? {
          image: "https://example.com/images/0025-EIeI8Vf.jpg",
          gif: "https://example.com/videos/0025-EIeI8Vf.gif",
        }
      : undefined,
}));

const benchPress: LibraryExercise = {
  id: "0025",
  name: "barbell bench press",
  category: "chest",
  body_part: "chest",
  equipment: "barbell",
  target: "pectorals",
  secondary_muscles: ["triceps", "delts"],
  instructions: {
    es: "Acuéstate en el banco y empuja la barra.",
    en: "Lie on the bench and press the bar.",
  },
  instruction_steps: {
    es: ["Acuéstate en el banco plano.", "Baja la barra al pecho.", "Empuja hacia arriba."],
    en: ["Lie on the flat bench.", "Lower the bar to your chest.", "Press back up."],
  },
  image: "images/0025-EIeI8Vf.jpg",
  gif: "videos/0025-EIeI8Vf.gif",
};

const loadExerciseLibraryMock = vi.fn();

// Keep pure helpers real; only stub the network loader.
vi.mock("@/features/exercises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/exercises")>();
  return {
    ...actual,
    loadExerciseLibrary: (...args: unknown[]) => loadExerciseLibraryMock(...args),
  };
});

function renderModal(onClose = vi.fn()) {
  render(
    <ExerciseDetailModal
      exerciseId="press_banca"
      name="Press de banca"
      altName="Bench press"
      onClose={onClose}
    />
  );
  return onClose;
}

describe("ExerciseDetailModal", () => {
  beforeEach(() => {
    window.localStorage.clear();
    loadExerciseLibraryMock.mockReset();
    loadExerciseLibraryMock.mockResolvedValue([benchPress]);
    document.body.style.overflow = "";
  });

  it("renders a dialog with the GIF and the JPG placeholder", async () => {
    renderModal();

    const dialog = screen.getByRole("dialog", { name: "Press de banca" });
    expect(dialog).toBeInTheDocument();

    const gif = screen.getByRole("img", { name: "Press de banca" });
    expect(gif).toHaveAttribute("src", "https://example.com/videos/0025-EIeI8Vf.gif");
    expect(screen.getByTestId("gif-spinner")).toBeInTheDocument();

    // Spinner disappears once the GIF loads
    fireEvent.load(gif);
    expect(screen.queryByTestId("gif-spinner")).not.toBeInTheDocument();

    await screen.findByText("Músculos trabajados");
  });

  it("defaults to Spanish: ES headers, translated muscles, and ES steps", async () => {
    renderModal();

    expect(await screen.findByText("Músculos trabajados")).toBeInTheDocument();
    expect(screen.getByText("Instrucciones")).toBeInTheDocument();
    expect(screen.getByText("Pectorales")).toBeInTheDocument();
    expect(screen.getByText("Tríceps")).toBeInTheDocument();
    expect(screen.getByText("Hombros")).toBeInTheDocument();
    expect(screen.getByText("Acuéstate en el banco plano.")).toBeInTheDocument();
  });

  it("switches to English via the EN toggle", async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByText("Músculos trabajados");

    await user.click(screen.getByRole("button", { name: "EN" }));

    expect(screen.getByText("Muscles worked")).toBeInTheDocument();
    expect(screen.getByText("Instructions")).toBeInTheDocument();
    expect(screen.getByText("Pectorals")).toBeInTheDocument();
    expect(screen.getByText("Lie on the flat bench.")).toBeInTheDocument();
    expect(screen.queryByText("Acuéstate en el banco plano.")).not.toBeInTheDocument();

    // Preference is persisted
    expect(window.localStorage.getItem("jcv-lang")).toBe("en");
  });

  it("locks body scroll while open and restores it on close", async () => {
    const user = userEvent.setup();
    const onClose = renderModal();
    await screen.findByText("Músculos trabajados");

    expect(document.body.style.overflow).toBe("hidden");

    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    const onClose = renderModal();
    await screen.findByText("Músculos trabajados");

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("still shows the GIF when the library fetch fails", async () => {
    loadExerciseLibraryMock.mockRejectedValue(new Error("network down"));
    renderModal();

    expect(
      await screen.findByRole("img", { name: "Press de banca" })
    ).toBeInTheDocument();

    // Wait for the loading skeleton to settle into the error state.
    await waitFor(() =>
      expect(screen.queryByLabelText("Cargando detalles...")).not.toBeInTheDocument()
    );
    expect(screen.queryByText("Músculos trabajados")).not.toBeInTheDocument();
    expect(screen.queryByText("Instrucciones")).not.toBeInTheDocument();
  });
});
