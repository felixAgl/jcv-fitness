import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PricingPage from "../page";
import { createMockUser, createMockProfile } from "@/test/mocks/supabase";

// Mock next/navigation
const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock("@/features/auth", () => ({
  useAuth: () => mockUseAuth(),
  AuthModal: ({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess?: () => void }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="auth-modal">
        <button onClick={onClose}>Close Auth</button>
        <button onClick={() => onSuccess?.()}>Auth Success</button>
      </div>
    );
  },
}));

// Mock CheckoutModal
vi.mock("@/features/payment/components/CheckoutModal", () => ({
  CheckoutModal: ({ isOpen, onClose, selectedPlan, onPaymentSuccess }: {
    isOpen: boolean;
    onClose: () => void;
    selectedPlan: string;
    onPaymentSuccess?: (id: string, provider: string) => void;
  }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="checkout-modal">
        <span data-testid="selected-plan">{selectedPlan}</span>
        <button onClick={onClose}>Close Checkout</button>
        <button onClick={() => onPaymentSuccess?.("tx-123", "mercadopago")}>
          Complete Payment
        </button>
      </div>
    );
  },
}));

describe("PricingPage", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render all subscription plans", async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });

      render(<PricingPage />);

      expect(screen.getByText("Basico")).toBeInTheDocument();
      expect(screen.getByText("Pro")).toBeInTheDocument();
      expect(screen.getByText("Premium")).toBeInTheDocument();
    });

    it("should show 'Mas popular' badge on Pro plan", async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });

      render(<PricingPage />);

      expect(screen.getByText("Mas popular")).toBeInTheDocument();
    });

    it("should render back button", async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });

      render(<PricingPage />);

      const backButton = screen.getByText("Volver");
      expect(backButton).toBeInTheDocument();
    });
  });

  describe("Plan Selection - Unauthenticated User", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });
    });

    it("should show auth modal when plan is selected", async () => {
      render(<PricingPage />);

      const selectButtons = screen.getAllByText("Seleccionar plan");
      await user.click(selectButtons[0]); // Select first plan

      expect(screen.getByTestId("auth-modal")).toBeInTheDocument();
    });

    it("should close auth modal and clear plan when closed", async () => {
      render(<PricingPage />);

      const selectButtons = screen.getAllByText("Seleccionar plan");
      await user.click(selectButtons[0]);

      expect(screen.getByTestId("auth-modal")).toBeInTheDocument();

      await user.click(screen.getByText("Close Auth"));

      expect(screen.queryByTestId("auth-modal")).not.toBeInTheDocument();
    });
  });

  describe("Plan Selection - Authenticated User", () => {
    beforeEach(() => {
      const mockUser = createMockUser();
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
      });
    });

    it("should show checkout modal directly when authenticated", async () => {
      render(<PricingPage />);

      const selectButtons = screen.getAllByText("Seleccionar plan");
      await user.click(selectButtons[1]); // Select Pro plan

      await waitFor(() => {
        expect(screen.getByTestId("checkout-modal")).toBeInTheDocument();
      });

      expect(screen.getByTestId("selected-plan").textContent).toBe("PLAN_PRO");
    });

    it("should close checkout modal and clear plan when closed", async () => {
      render(<PricingPage />);

      const selectButtons = screen.getAllByText("Seleccionar plan");
      await user.click(selectButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId("checkout-modal")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Close Checkout"));

      expect(screen.queryByTestId("checkout-modal")).not.toBeInTheDocument();
    });
  });

  describe("Auth to Checkout Flow", () => {
    it("should show checkout after successful auth", async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });

      render(<PricingPage />);

      const selectButtons = screen.getAllByText("Seleccionar plan");
      await user.click(selectButtons[0]);

      expect(screen.getByTestId("auth-modal")).toBeInTheDocument();

      // Simulate auth success
      await user.click(screen.getByText("Auth Success"));

      await waitFor(() => {
        expect(screen.queryByTestId("auth-modal")).not.toBeInTheDocument();
        expect(screen.getByTestId("checkout-modal")).toBeInTheDocument();
      });
    });
  });

  describe("Payment Success", () => {
    it("should redirect to success page after payment", async () => {
      const mockUser = createMockUser();
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
      });

      render(<PricingPage />);

      const selectButtons = screen.getAllByText("Seleccionar plan");
      await user.click(selectButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId("checkout-modal")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Complete Payment"));

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("/payment/success")
      );
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("payment_id=tx-123")
      );
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("status=approved")
      );
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("provider=mercadopago")
      );
    });
  });

  describe("Auth Loading State", () => {
    it("should wait for auth to load before showing modal", async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
      });

      render(<PricingPage />);

      const selectButtons = screen.getAllByText("Seleccionar plan");
      await user.click(selectButtons[0]);

      // Neither modal should be shown while loading
      expect(screen.queryByTestId("auth-modal")).not.toBeInTheDocument();
      expect(screen.queryByTestId("checkout-modal")).not.toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("should call router.back when back button is clicked", async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });

      render(<PricingPage />);

      await user.click(screen.getByText("Volver"));

      expect(mockBack).toHaveBeenCalled();
    });
  });
});
