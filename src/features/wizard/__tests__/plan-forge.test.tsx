import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { PlanForge } from "../components/PlanForge";

const LINES = ["NIVEL: INTERMEDIO", "OBJETIVO: GANAR MUSCULO", "60 MIN / SESION"];

describe("PlanForge", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("stamps the user's inputs one by one and reveals the plan name before calling onDone", () => {
    const onDone = vi.fn();
    render(<PlanForge lines={LINES} planName="PLAN DE JUAN" onDone={onDone} />);

    expect(screen.getByTestId("plan-forge")).toBeInTheDocument();
    expect(screen.queryByText("NIVEL: INTERMEDIO")).not.toBeInTheDocument();

    // First line at 500ms
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByText("NIVEL: INTERMEDIO")).toBeInTheDocument();
    expect(screen.queryByText("60 MIN / SESION")).not.toBeInTheDocument();

    // Remaining lines at 1200ms / 1900ms
    act(() => {
      vi.advanceTimersByTime(1400);
    });
    expect(screen.getByText("OBJETIVO: GANAR MUSCULO")).toBeInTheDocument();
    expect(screen.getByText("60 MIN / SESION")).toBeInTheDocument();
    expect(screen.queryByText("PLAN DE JUAN")).not.toBeInTheDocument();

    // Plan name reveal at 3300ms
    act(() => {
      vi.advanceTimersByTime(1400);
    });
    expect(screen.getByText("PLAN DE JUAN")).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();

    // Done after holding the reveal
    act(() => {
      vi.advanceTimersByTime(1900);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("calls onDone immediately when 'saltar' is tapped", () => {
    const onDone = vi.fn();
    render(<PlanForge lines={LINES} planName="PLAN DE JUAN" onDone={onDone} />);

    fireEvent.click(screen.getByText("saltar"));

    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("skips the whole sequence under prefers-reduced-motion", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: true })
    );
    const onDone = vi.fn();
    render(<PlanForge lines={LINES} planName="PLAN DE JUAN" onDone={onDone} />);

    expect(screen.queryByTestId("plan-forge")).not.toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
