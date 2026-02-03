import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckoutModal } from "../CheckoutModal";

// Mock payment utilities
vi.mock("../utils/mercado-pago", () => ({
  loadMercadoPagoSDK: vi.fn().mockResolvedValue(undefined),
  JCV_PRODUCTS: {
    PLAN_BASICO: { id: "plan-basico", title: "Plan Basico", unit_price: 29900 },
    PLAN_PRO: { id: "plan-pro", title: "Plan Pro", unit_price: 39900 },
    PLAN_PREMIUM: { id: "plan-premium", title: "Plan Premium", unit_price: 49900 },
  },
}));

vi.mock("../utils/wompi", () => ({
  openWompiCheckout: vi.fn(),
  generateReference: vi.fn(() => "ref-123"),
  formatCOP: vi.fn((cents: number) => `$${(cents / 100).toLocaleString("es-CO")} COP`),
  JCV_PRODUCTS_COP: {
    PLAN_BASICO: { amountInCents: 2990000, description: "Plan Basico" },
    PLAN_PRO: { amountInCents: 3990000, description: "Plan Pro" },
    PLAN_PREMIUM: { amountInCents: 4990000, description: "Plan Premium" },
  },
}));

// Mock fetch for MercadoPago
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.location
const mockLocation = {
  origin: "https://jcvfitness.com",
  href: "",
  hostname: "jcvfitness.com",
};

Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

describe("CheckoutModal", () => {
  const user = userEvent.setup();
  const mockOnClose = vi.fn();
  const mockOnPaymentSuccess = vi.fn();
  const mockOnPaymentError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = "";

    // Set environment variables
    vi.stubEnv("NEXT_PUBLIC_MP_WORKER_URL", "https://worker.example.com");
    vi.stubEnv("NEXT_PUBLIC_WOMPI_PUBLIC_KEY", "pub_test_key");
  });

  describe("Rendering", () => {
    it("should not render when isOpen is false", () => {
      render(
        <CheckoutModal
          isOpen={false}
          onClose={mockOnClose}
          selectedPlan="PLAN_PRO"
        />
      );

      expect(screen.queryByText("Finalizar Compra")).not.toBeInTheDocument();
    });

    it("should render when isOpen is true", () => {
      render(
        <CheckoutModal
          isOpen={true}
          onClose={mockOnClose}
          selectedPlan="PLAN_PRO"
        />
      );

      expect(screen.getByText("Finalizar Compra")).toBeInTheDocument();
    });

    it("should display selected plan title", () => {
      render(
        <CheckoutModal
          isOpen={true}
          onClose={mockOnClose}
          selectedPlan="PLAN_PRO"
        />
      );

      expect(screen.getByText("Plan Pro")).toBeInTheDocument();
    });

    it("should display formatted price", () => {
      render(
        <CheckoutModal
          isOpen={true}
          onClose={mockOnClose}
          selectedPlan="PLAN_PRO"
        />
      );

      expect(screen.getByText(/\$.*COP/)).toBeInTheDocument();
    });

    it("should show step indicator when showStepIndicator is true", () => {
      render(
        <CheckoutModal
          isOpen={true}
          onClose={mockOnClose}
          selectedPlan="PLAN_PRO"
          showStepIndicator={true}
        />
      );

      expect(screen.getByText("Cuenta")).toBeInTheDocument();
      expect(screen.getByText("Pago")).toBeInTheDocument();
      expect(screen.getByText("Paso 2 de 2 - Ultimo paso")).toBeInTheDocument();
    });
  });

  describe("Close Modal", () => {
    it("should call onClose when close button is clicked", async () => {
      render(
        <CheckoutModal
          isOpen={true}
          onClose={mockOnClose}
          selectedPlan="PLAN_PRO"
        />
      );

      const closeButton = screen.getByRole("button", { name: "" }); // X button
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should call onClose when backdrop is clicked", async () => {
      render(
        <CheckoutModal
          isOpen={true}
          onClose={mockOnClose}
          selectedPlan="PLAN_PRO"
        />
      );

      // Click on backdrop (the first overlay div)
      const backdrop = document.querySelector(".bg-black\\/80");
      if (backdrop) {
        await user.click(backdrop);
      }

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("MercadoPago Payment", () => {
    it("should show MercadoPago button", () => {
      render(
        <CheckoutModal
          isOpen={true}
          onClose={mockOnClose}
          selectedPlan="PLAN_PRO"
        />
      );

      expect(screen.getByText("Pagar con Mercado Pago")).toBeInTheDocument();
    });

    it("should redirect to MercadoPago checkout on success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            init_point: "https://mercadopago.com/checkout/123",
            sandbox_init_point: "https://sandbox.mercadopago.com/checkout/123",
          }),
      });

      render(
        <CheckoutModal
          isOpen={true}
          onClose={mockOnClose}
          selectedPlan="PLAN_PRO"
          customerEmail="test@test.com"
        />
      );

      await user.click(screen.getByText("Pagar con Mercado Pago"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it("should show error when MercadoPago fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Server error" }),
      });

      render(
        <CheckoutModal
          isOpen={true}
          onClose={mockOnClose}
          selectedPlan="PLAN_PRO"
          onPaymentError={mockOnPaymentError}
        />
      );

      await user.click(screen.getByText("Pagar con Mercado Pago"));

      await waitFor(() => {
        expect(screen.getByText(/Server error/)).toBeInTheDocument();
      });

      expect(mockOnPaymentError).toHaveBeenCalled();
    });

    it("should show error when worker URL is missing", async () => {
      vi.unstubAllEnvs();
      vi.stubEnv("NEXT_PUBLIC_MP_WORKER_URL", "");

      render(
        <CheckoutModal
          isOpen={true}
          onClose={mockOnClose}
          selectedPlan="PLAN_PRO"
          onPaymentError={mockOnPaymentError}
        />
      );

      await user.click(screen.getByText("Pagar con Mercado Pago"));

      await waitFor(() => {
        expect(screen.getByText(/Pago no disponible temporalmente/)).toBeInTheDocument();
      });
    });
  });

  describe("Wompi Payment", () => {
    it("should show Wompi button", () => {
      render(
        <CheckoutModal
          isOpen={true}
          onClose={mockOnClose}
          selectedPlan="PLAN_PRO"
        />
      );

      expect(screen.getByText("Pagar con Wompi")).toBeInTheDocument();
    });

    it("should show payment methods info", () => {
      render(
        <CheckoutModal
          isOpen={true}
          onClose={mockOnClose}
          selectedPlan="PLAN_PRO"
        />
      );

      expect(screen.getByText(/PSE, Nequi, Tarjetas, Bancolombia QR/)).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("should disable buttons during loading", async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ ok: true, json: () => ({}) }), 1000)
          )
      );

      render(
        <CheckoutModal
          isOpen={true}
          onClose={mockOnClose}
          selectedPlan="PLAN_PRO"
        />
      );

      await user.click(screen.getByText("Pagar con Mercado Pago"));

      const mpButton = screen.getByText("Pagar con Mercado Pago").closest("button");
      const wompiButton = screen.getByText("Pagar con Wompi").closest("button");

      expect(mpButton).toBeDisabled();
      expect(wompiButton).toBeDisabled();
    });
  });

  describe("Security Badges", () => {
    it("should show security information", () => {
      render(
        <CheckoutModal
          isOpen={true}
          onClose={mockOnClose}
          selectedPlan="PLAN_PRO"
        />
      );

      expect(screen.getByText("SSL Seguro")).toBeInTheDocument();
      expect(screen.getByText("Datos protegidos")).toBeInTheDocument();
      expect(screen.getByText(/PCI DSS/)).toBeInTheDocument();
    });
  });

  describe("Different Plans", () => {
    it("should display correct plan for PLAN_BASICO", () => {
      render(
        <CheckoutModal
          isOpen={true}
          onClose={mockOnClose}
          selectedPlan="PLAN_BASICO"
        />
      );

      expect(screen.getByText("Plan Basico")).toBeInTheDocument();
    });

    it("should display correct plan for PLAN_PREMIUM", () => {
      render(
        <CheckoutModal
          isOpen={true}
          onClose={mockOnClose}
          selectedPlan="PLAN_PREMIUM"
        />
      );

      expect(screen.getByText("Plan Premium")).toBeInTheDocument();
    });
  });

  describe("Customer Data", () => {
    it("should include customer email in MercadoPago request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ init_point: "https://mp.com/checkout" }),
      });

      render(
        <CheckoutModal
          isOpen={true}
          onClose={mockOnClose}
          selectedPlan="PLAN_PRO"
          customerEmail="customer@test.com"
          customerName="John Doe"
        />
      );

      await user.click(screen.getByText("Pagar con Mercado Pago"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: expect.stringContaining("customer@test.com"),
          })
        );
      });
    });
  });
});
