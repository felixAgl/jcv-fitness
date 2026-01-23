import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OptionCard } from "../components/OptionCard";

describe("OptionCard", () => {
  describe("rendering", () => {
    it("should render title", () => {
      render(
        <OptionCard
          title="Test Title"
          isSelected={false}
          onClick={vi.fn()}
        />
      );

      expect(screen.getByText("Test Title")).toBeInTheDocument();
    });

    it("should render subtitle when provided", () => {
      render(
        <OptionCard
          title="Test"
          subtitle="Test Subtitle"
          isSelected={false}
          onClick={vi.fn()}
        />
      );

      expect(screen.getByText("Test Subtitle")).toBeInTheDocument();
    });

    it("should render description when provided", () => {
      render(
        <OptionCard
          title="Test"
          description="Test Description"
          isSelected={false}
          onClick={vi.fn()}
        />
      );

      expect(screen.getByText("Test Description")).toBeInTheDocument();
    });

    it("should render emoji when provided", () => {
      render(
        <OptionCard
          title="Test"
          emoji="🏋️"
          isSelected={false}
          onClick={vi.fn()}
        />
      );

      expect(screen.getByText("🏋️")).toBeInTheDocument();
    });
  });

  describe("selection state", () => {
    it("should show checkmark when selected", () => {
      render(
        <OptionCard
          title="Test"
          isSelected={true}
          onClick={vi.fn()}
        />
      );

      const checkmark = document.querySelector("svg");
      expect(checkmark).toBeInTheDocument();
    });

    it("should not show checkmark when not selected", () => {
      const { container } = render(
        <OptionCard
          title="Test"
          isSelected={false}
          onClick={vi.fn()}
        />
      );

      const checkmarkContainer = container.querySelector(".absolute.top-2.right-2");
      expect(checkmarkContainer).not.toBeInTheDocument();
    });

    it("should apply selected color classes when selected", () => {
      render(
        <OptionCard
          title="Test"
          isSelected={true}
          onClick={vi.fn()}
          color="cyan"
        />
      );

      const button = screen.getByRole("button");
      expect(button.className).toContain("border-accent-cyan");
      expect(button.className).toContain("ring-2");
      expect(button.className).toContain("shadow-lg");
    });

    it("should apply unselected classes when not selected", () => {
      render(
        <OptionCard
          title="Test"
          isSelected={false}
          onClick={vi.fn()}
        />
      );

      const button = screen.getByRole("button");
      expect(button.className).toContain("border-gray-600");
      expect(button.className).toContain("bg-gray-900");
    });
  });

  describe("color variants", () => {
    const colors = ["cyan", "red", "green", "blue", "yellow", "purple", "orange", "pink"];

    colors.forEach((color) => {
      it(`should apply ${color} color when selected`, () => {
        render(
          <OptionCard
            title="Test"
            isSelected={true}
            onClick={vi.fn()}
            color={color}
          />
        );

        const button = screen.getByRole("button");
        if (color === "cyan" || color === "red" || color === "green" || color === "blue") {
          expect(button.className).toContain(`border-accent-${color}`);
        } else {
          expect(button.className).toContain(`border-${color}-500`);
        }
      });
    });
  });

  describe("size variants", () => {
    it("should apply sm padding", () => {
      render(
        <OptionCard
          title="Test"
          isSelected={false}
          onClick={vi.fn()}
          size="sm"
        />
      );

      const button = screen.getByRole("button");
      expect(button.className).toContain("p-3");
    });

    it("should apply md padding by default", () => {
      render(
        <OptionCard
          title="Test"
          isSelected={false}
          onClick={vi.fn()}
        />
      );

      const button = screen.getByRole("button");
      expect(button.className).toContain("p-4");
    });

    it("should apply lg padding", () => {
      render(
        <OptionCard
          title="Test"
          isSelected={false}
          onClick={vi.fn()}
          size="lg"
        />
      );

      const button = screen.getByRole("button");
      expect(button.className).toContain("p-6");
    });
  });

  describe("interactions", () => {
    it("should call onClick when clicked", () => {
      const onClick = vi.fn();
      render(
        <OptionCard
          title="Test"
          isSelected={false}
          onClick={onClick}
        />
      );

      fireEvent.click(screen.getByRole("button"));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("should call onClick when already selected", () => {
      const onClick = vi.fn();
      render(
        <OptionCard
          title="Test"
          isSelected={true}
          onClick={onClick}
        />
      );

      fireEvent.click(screen.getByRole("button"));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});
