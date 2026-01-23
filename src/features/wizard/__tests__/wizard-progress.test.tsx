import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WizardProgress } from "../components/WizardProgress";

describe("WizardProgress", () => {
  describe("rendering", () => {
    it("should render all 8 steps", () => {
      render(<WizardProgress currentStep={1} totalSteps={8} />);

      // Should show step numbers or checkmarks for all 8 steps
      const stepContainer = document.querySelectorAll(".flex.items-center.flex-1");
      expect(stepContainer).toHaveLength(8);
    });

    it("should display current step text", () => {
      render(<WizardProgress currentStep={3} totalSteps={8} />);

      // Text is split across elements, so use regex matchers
      expect(screen.getByText(/Paso/)).toBeInTheDocument();
      expect(screen.getByText(/de/)).toBeInTheDocument();
    });

    it("should render step labels", () => {
      render(<WizardProgress currentStep={1} totalSteps={8} />);

      expect(screen.getByText("Nivel")).toBeInTheDocument();
      expect(screen.getByText("Objetivo")).toBeInTheDocument();
      expect(screen.getByText("Tiempo")).toBeInTheDocument();
      expect(screen.getByText("Equipo")).toBeInTheDocument();
      expect(screen.getByText("Duracion")).toBeInTheDocument();
      expect(screen.getByText("Tu Cuerpo")).toBeInTheDocument();
      expect(screen.getByText("Ejercicios")).toBeInTheDocument();
      expect(screen.getByText("Resumen")).toBeInTheDocument();
    });
  });

  describe("step states", () => {
    it("should show active step with white background", () => {
      const { container } = render(<WizardProgress currentStep={3} totalSteps={8} />);

      // Step 3 should have white bg (active)
      const circles = container.querySelectorAll(".w-10.h-10.rounded-full");
      const activeCircle = circles[2]; // 0-indexed
      expect(activeCircle.className).toContain("bg-white");
    });

    it("should show completed steps with amber background", () => {
      const { container } = render(<WizardProgress currentStep={4} totalSteps={8} />);

      // Steps 1, 2, 3 should have amber bg (completed)
      const circles = container.querySelectorAll(".w-10.h-10.rounded-full");

      expect(circles[0].className).toContain("bg-amber-500");
      expect(circles[1].className).toContain("bg-amber-500");
      expect(circles[2].className).toContain("bg-amber-500");
    });

    it("should show pending steps with gray background", () => {
      const { container } = render(<WizardProgress currentStep={3} totalSteps={8} />);

      // Steps 4-8 should have gray bg (pending)
      const circles = container.querySelectorAll(".w-10.h-10.rounded-full");

      expect(circles[3].className).toContain("bg-gray-700");
      expect(circles[4].className).toContain("bg-gray-700");
      expect(circles[5].className).toContain("bg-gray-700");
      expect(circles[6].className).toContain("bg-gray-700");
      expect(circles[7].className).toContain("bg-gray-700");
    });

    it("should show checkmark icon for completed steps", () => {
      const { container } = render(<WizardProgress currentStep={3} totalSteps={8} />);

      // Completed steps should have SVG checkmarks
      const circles = container.querySelectorAll(".w-10.h-10.rounded-full");

      // Steps 1 and 2 (completed) should contain SVG
      expect(circles[0].querySelector("svg")).toBeInTheDocument();
      expect(circles[1].querySelector("svg")).toBeInTheDocument();

      // Active step 3 should show number, not checkmark
      expect(circles[2].textContent).toBe("3");
    });

    it("should show step number for active and pending steps", () => {
      const { container } = render(<WizardProgress currentStep={2} totalSteps={8} />);

      const circles = container.querySelectorAll(".w-10.h-10.rounded-full");

      // Step 2 is active, should show "2"
      expect(circles[1].textContent).toBe("2");

      // Steps 3-8 are pending, should show their numbers
      expect(circles[2].textContent).toBe("3");
      expect(circles[3].textContent).toBe("4");
      expect(circles[4].textContent).toBe("5");
    });
  });

  describe("connector lines", () => {
    it("should render connector lines between steps", () => {
      const { container } = render(<WizardProgress currentStep={1} totalSteps={8} />);

      // 7 connector lines for 8 steps
      const connectors = container.querySelectorAll(".flex-1.h-1.mx-2");
      expect(connectors).toHaveLength(7);
    });

    it("should color completed connectors with amber", () => {
      const { container } = render(<WizardProgress currentStep={4} totalSteps={8} />);

      const connectors = container.querySelectorAll(".flex-1.h-1.mx-2");

      // First 3 connectors should be amber (between completed steps)
      expect(connectors[0].className).toContain("bg-amber-500");
      expect(connectors[1].className).toContain("bg-amber-500");
      expect(connectors[2].className).toContain("bg-amber-500");
    });

    it("should color pending connectors with gray", () => {
      const { container } = render(<WizardProgress currentStep={2} totalSteps={8} />);

      const connectors = container.querySelectorAll(".flex-1.h-1.mx-2");

      // Connectors after active step should be gray
      expect(connectors[1].className).toContain("bg-gray-700");
      expect(connectors[2].className).toContain("bg-gray-700");
    });
  });

  describe("first and last step", () => {
    it("should render correctly on first step", () => {
      const { container } = render(<WizardProgress currentStep={1} totalSteps={8} />);

      const circles = container.querySelectorAll(".w-10.h-10.rounded-full");

      // First step active (white)
      expect(circles[0].className).toContain("bg-white");
      // All others pending (gray)
      expect(circles[1].className).toContain("bg-gray-700");
    });

    it("should render correctly on last step", () => {
      const { container } = render(<WizardProgress currentStep={8} totalSteps={8} />);

      const circles = container.querySelectorAll(".w-10.h-10.rounded-full");

      // All steps 1-7 completed (amber)
      for (let i = 0; i < 7; i++) {
        expect(circles[i].className).toContain("bg-amber-500");
      }

      // Last step active (white)
      expect(circles[7].className).toContain("bg-white");
    });
  });
});
