import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NavigationButtons } from "../components/NavigationButtons";

describe("NavigationButtons", () => {
  describe("rendering", () => {
    it("should render the next button with default label", () => {
      render(
        <NavigationButtons
          onNext={vi.fn()}
          canProceed={true}
        />
      );

      expect(screen.getByText("Continuar")).toBeInTheDocument();
    });

    it("should render with custom next label", () => {
      render(
        <NavigationButtons
          onNext={vi.fn()}
          canProceed={true}
          nextLabel="Siguiente"
        />
      );

      expect(screen.getByText("Siguiente")).toBeInTheDocument();
    });

    it("should render Finalizar on last step", () => {
      render(
        <NavigationButtons
          onNext={vi.fn()}
          canProceed={true}
          isLastStep
        />
      );

      expect(screen.getByText("Finalizar")).toBeInTheDocument();
    });

    it("should not render back button on first step", () => {
      render(
        <NavigationButtons
          onNext={vi.fn()}
          onBack={vi.fn()}
          canProceed={true}
          isFirstStep
        />
      );

      expect(screen.queryByText("Atras")).not.toBeInTheDocument();
    });

    it("should render back button when not first step", () => {
      render(
        <NavigationButtons
          onNext={vi.fn()}
          onBack={vi.fn()}
          canProceed={true}
          isFirstStep={false}
        />
      );

      expect(screen.getByText("Atras")).toBeInTheDocument();
    });
  });

  describe("canProceed state", () => {
    it("should enable button when canProceed is true", () => {
      render(
        <NavigationButtons
          onNext={vi.fn()}
          canProceed={true}
        />
      );

      const button = screen.getByText("Continuar");
      expect(button).not.toBeDisabled();
    });

    it("should disable button when canProceed is false", () => {
      render(
        <NavigationButtons
          onNext={vi.fn()}
          canProceed={false}
        />
      );

      const button = screen.getByText("Continuar");
      expect(button).toBeDisabled();
    });

    it("should apply green classes when canProceed is true", () => {
      render(
        <NavigationButtons
          onNext={vi.fn()}
          canProceed={true}
        />
      );

      const button = screen.getByText("Continuar");
      expect(button.className).toContain("bg-accent-green");
    });

    it("should apply gray classes when canProceed is false", () => {
      render(
        <NavigationButtons
          onNext={vi.fn()}
          canProceed={false}
        />
      );

      const button = screen.getByText("Continuar");
      expect(button.className).toContain("bg-gray-800");
      expect(button.className).toContain("cursor-not-allowed");
    });
  });

  describe("interactions", () => {
    it("should call onNext when clicked and canProceed", () => {
      const onNext = vi.fn();
      render(
        <NavigationButtons
          onNext={onNext}
          canProceed={true}
        />
      );

      fireEvent.click(screen.getByText("Continuar"));
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it("should not call onNext when disabled", () => {
      const onNext = vi.fn();
      render(
        <NavigationButtons
          onNext={onNext}
          canProceed={false}
        />
      );

      fireEvent.click(screen.getByText("Continuar"));
      expect(onNext).not.toHaveBeenCalled();
    });

    it("should call onBack when back button clicked", () => {
      const onBack = vi.fn();
      render(
        <NavigationButtons
          onNext={vi.fn()}
          onBack={onBack}
          canProceed={true}
          isFirstStep={false}
        />
      );

      fireEvent.click(screen.getByText("Atras"));
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });
});
