import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Coach,
  EmptyPlan,
  EmptyProgress,
  NoConnection,
  NotFound,
  PlanReady,
  type IllustrationProps,
} from "..";

const ILLUSTRATIONS: Array<[string, (p: IllustrationProps) => React.ReactElement]> = [
  ["EmptyPlan", EmptyPlan],
  ["EmptyProgress", EmptyProgress],
  ["NoConnection", NoConnection],
  ["PlanReady", PlanReady],
  ["NotFound", NotFound],
  ["Coach", Coach],
];

describe("brand illustrations", () => {
  it.each(ILLUSTRATIONS)("%s exposes an accessible name when title is passed", (name, Illustration) => {
    const { container } = render(<Illustration title={`Ilustracion ${name}`} />);

    expect(screen.getByRole("img", { name: `Ilustracion ${name}` })).toBeInTheDocument();
    expect(container.querySelector("title")?.textContent).toBe(`Ilustracion ${name}`);
  });

  it.each(ILLUSTRATIONS)("%s is hidden from assistive tech when decorative", (_name, Illustration) => {
    const { container } = render(<Illustration className="w-10" />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveClass("w-10");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
