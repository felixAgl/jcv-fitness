import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExerciseMediaThumb } from "../ExerciseMediaThumb";

// Mock exercise media: only "sentadilla" has media
vi.mock("@/features/wizard/data/exercise-media", () => ({
  EXERCISE_MEDIA: {},
  getExerciseMedia: (exerciseId: string) =>
    exerciseId === "sentadilla"
      ? { image: "https://example.com/sentadilla.jpg", gif: "https://example.com/sentadilla.gif" }
      : undefined,
}));

describe("ExerciseMediaThumb", () => {
  it("should render emoji fallback when exercise has no media", () => {
    render(<ExerciseMediaThumb exerciseId="sin_media" emoji="🦵" name="Sentadillas" />);

    expect(screen.getByText("🦵")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("should render default emoji when no media and no emoji provided", () => {
    render(<ExerciseMediaThumb exerciseId="sin_media" />);

    expect(screen.getByText("🏋️")).toBeInTheDocument();
  });

  it("should render thumbnail image when media exists", () => {
    render(<ExerciseMediaThumb exerciseId="sentadilla" emoji="🦵" name="Sentadillas" />);

    const img = screen.getByRole("img", { name: "Sentadillas" });
    expect(img).toHaveAttribute("src", "https://example.com/sentadilla.jpg");
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("should toggle to gif on click and back to image on second click", async () => {
    const user = userEvent.setup();
    render(<ExerciseMediaThumb exerciseId="sentadilla" emoji="🦵" name="Sentadillas" />);

    const button = screen.getByRole("button");

    await user.click(button);
    expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/sentadilla.gif");

    await user.click(button);
    expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/sentadilla.jpg");
  });
});
