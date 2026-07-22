import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MuscleAtlas, pickAtlasView, resolveRegion, hasAtlasRegion } from "..";

function regionGroup(container: HTMLElement, region: string): SVGGElement | null {
  return container.querySelector(`g[data-region="${region}"]`);
}

describe("MuscleAtlas", () => {
  it("exposes an accessible name when title is passed", () => {
    const { container } = render(
      <MuscleAtlas view="front" primary={["pectorals"]} title="Mapa muscular" />
    );

    expect(screen.getByRole("img", { name: "Mapa muscular" })).toBeInTheDocument();
    expect(container.querySelector("title")?.textContent).toBe("Mapa muscular");
  });

  it("is hidden from assistive tech when decorative", () => {
    const { container } = render(<MuscleAtlas view="front" className="w-14 h-28" />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveClass("w-14");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("marks primary and secondary muscles with cyan emphasis", () => {
    const { container } = render(
      <MuscleAtlas view="front" primary={["pectorals"]} secondary={["delts", "triceps"]} />
    );

    const pecs = regionGroup(container, "pectorals");
    expect(pecs).toHaveAttribute("data-emphasis", "primary");
    expect(pecs).toHaveAttribute("fill-opacity", "1");

    const delts = regionGroup(container, "delts");
    expect(delts).toHaveAttribute("data-emphasis", "secondary");
    expect(delts).toHaveAttribute("fill-opacity", "0.35");

    const quads = regionGroup(container, "quads");
    expect(quads).toHaveAttribute("data-emphasis", "none");
  });

  it("maps the wider secondary_muscles vocabulary onto regions", () => {
    const { container } = render(
      <MuscleAtlas view="back" primary={["glutes"]} secondary={["hamstrings", "lower back"]} />
    );

    expect(regionGroup(container, "glutes")).toHaveAttribute("data-emphasis", "primary");
    expect(regionGroup(container, "hamstrings")).toHaveAttribute("data-emphasis", "secondary");
    expect(regionGroup(container, "lower-back")).toHaveAttribute("data-emphasis", "secondary");
  });

  it("promotes a muscle listed as both primary and secondary to primary", () => {
    const { container } = render(
      <MuscleAtlas view="front" primary={["quads"]} secondary={["quadriceps"]} />
    );

    expect(regionGroup(container, "quads")).toHaveAttribute("data-emphasis", "primary");
  });

  it("ignores unknown muscles gracefully", () => {
    const { container } = render(
      <MuscleAtlas view="front" primary={["cardiovascular system", "nonsense"]} />
    );

    expect(container.querySelector('[data-emphasis="primary"]')).toBeNull();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("only renders regions visible in the requested view", () => {
    const { container: front } = render(<MuscleAtlas view="front" />);
    const { container: back } = render(<MuscleAtlas view="back" />);

    expect(regionGroup(front, "pectorals")).not.toBeNull();
    expect(regionGroup(front, "lats")).toBeNull();
    expect(regionGroup(back, "lats")).not.toBeNull();
    expect(regionGroup(back, "pectorals")).toBeNull();
  });
});

describe("pickAtlasView", () => {
  it("picks front for chest-dominant work (bench press)", () => {
    expect(pickAtlasView(["pectorals"], ["delts", "triceps"])).toBe("front");
  });

  it("picks back for posterior-chain work (deadlift)", () => {
    expect(pickAtlasView(["glutes"], ["hamstrings", "lower back"])).toBe("back");
  });

  it("weights the primary target over assistance muscles (pull-up)", () => {
    // 3x lats (back) beats 1x biceps + 1x forearms (front)
    expect(pickAtlasView(["lats"], ["biceps", "forearms"])).toBe("back");
  });

  it("defaults to front on ties or when nothing resolves", () => {
    expect(pickAtlasView(["pectorals"], ["delts", "traps"])).toBe("front");
    expect(pickAtlasView([], [])).toBe("front");
  });
});

describe("resolveRegion / hasAtlasRegion", () => {
  it("maps dataset vocabulary and aliases", () => {
    expect(resolveRegion("pectorals")).toBe("pectorals");
    expect(resolveRegion("Quadriceps")).toBe("quads");
    expect(resolveRegion("upper back")).toBe("lats");
    expect(resolveRegion("abductors")).toBe("glutes");
    expect(resolveRegion("spine")).toBe("lower-back");
  });

  it("returns null for unmapped vocabulary", () => {
    expect(resolveRegion("cardiovascular system")).toBeNull();
    expect(resolveRegion("hands")).toBeNull();
  });

  it("hasAtlasRegion reflects whether anything can be highlighted", () => {
    expect(hasAtlasRegion(["cardiovascular system"])).toBe(false);
    expect(hasAtlasRegion(["cardiovascular system", "calves"])).toBe(true);
  });
});
