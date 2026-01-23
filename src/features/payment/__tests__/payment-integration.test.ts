import { describe, it, expect } from "vitest";
import { JCV_PRODUCTS } from "../utils/mercado-pago";
import { JCV_PRODUCTS_COP, formatCOP, copToCents, generateReference } from "../utils/wompi";

describe("Payment Integration", () => {
  describe("MercadoPago products", () => {
    it("should have all three plans defined", () => {
      expect(JCV_PRODUCTS.PLAN_BASICO).toBeDefined();
      expect(JCV_PRODUCTS.PLAN_PRO).toBeDefined();
      expect(JCV_PRODUCTS.PLAN_PREMIUM).toBeDefined();
    });

    it("should have correct prices for each plan", () => {
      expect(JCV_PRODUCTS.PLAN_BASICO.unitPrice).toBe(49900);
      expect(JCV_PRODUCTS.PLAN_PRO.unitPrice).toBe(89900);
      expect(JCV_PRODUCTS.PLAN_PREMIUM.unitPrice).toBe(149900);
    });

    it("should have COP as currency for all plans", () => {
      expect(JCV_PRODUCTS.PLAN_BASICO.currencyId).toBe("COP");
      expect(JCV_PRODUCTS.PLAN_PRO.currencyId).toBe("COP");
      expect(JCV_PRODUCTS.PLAN_PREMIUM.currencyId).toBe("COP");
    });

    it("should have quantity of 1 for all plans", () => {
      expect(JCV_PRODUCTS.PLAN_BASICO.quantity).toBe(1);
      expect(JCV_PRODUCTS.PLAN_PRO.quantity).toBe(1);
      expect(JCV_PRODUCTS.PLAN_PREMIUM.quantity).toBe(1);
    });

    it("should have titles containing JCV Fitness", () => {
      expect(JCV_PRODUCTS.PLAN_BASICO.title).toContain("JCV Fitness");
      expect(JCV_PRODUCTS.PLAN_PRO.title).toContain("JCV Fitness");
      expect(JCV_PRODUCTS.PLAN_PREMIUM.title).toContain("JCV Fitness");
    });
  });

  describe("Wompi products", () => {
    it("should have all three plans defined", () => {
      expect(JCV_PRODUCTS_COP.PLAN_BASICO).toBeDefined();
      expect(JCV_PRODUCTS_COP.PLAN_PRO).toBeDefined();
      expect(JCV_PRODUCTS_COP.PLAN_PREMIUM).toBeDefined();
    });

    it("should have correct prices in cents for each plan", () => {
      // $49,900 COP = 4,990,000 cents
      expect(JCV_PRODUCTS_COP.PLAN_BASICO.amountInCents).toBe(4990000);
      // $89,900 COP = 8,990,000 cents
      expect(JCV_PRODUCTS_COP.PLAN_PRO.amountInCents).toBe(8990000);
      // $149,900 COP = 14,990,000 cents
      expect(JCV_PRODUCTS_COP.PLAN_PREMIUM.amountInCents).toBe(14990000);
    });

    it("should have names containing JCV Fitness", () => {
      expect(JCV_PRODUCTS_COP.PLAN_BASICO.name).toContain("JCV Fitness");
      expect(JCV_PRODUCTS_COP.PLAN_PRO.name).toContain("JCV Fitness");
      expect(JCV_PRODUCTS_COP.PLAN_PREMIUM.name).toContain("JCV Fitness");
    });
  });

  describe("Price synchronization", () => {
    it("should have matching prices between MercadoPago and Wompi", () => {
      // MercadoPago uses COP directly, Wompi uses cents (COP * 100)
      expect(JCV_PRODUCTS.PLAN_BASICO.unitPrice * 100).toBe(JCV_PRODUCTS_COP.PLAN_BASICO.amountInCents);
      expect(JCV_PRODUCTS.PLAN_PRO.unitPrice * 100).toBe(JCV_PRODUCTS_COP.PLAN_PRO.amountInCents);
      expect(JCV_PRODUCTS.PLAN_PREMIUM.unitPrice * 100).toBe(JCV_PRODUCTS_COP.PLAN_PREMIUM.amountInCents);
    });
  });

  describe("Wompi utilities", () => {
    it("should format COP correctly", () => {
      expect(formatCOP(4990000)).toMatch(/49[.,]900/); // Handles locale differences
      expect(formatCOP(8990000)).toMatch(/89[.,]900/);
      expect(formatCOP(14990000)).toMatch(/149[.,]900/);
    });

    it("should convert COP to cents correctly", () => {
      expect(copToCents(49900)).toBe(4990000);
      expect(copToCents(89900)).toBe(8990000);
      expect(copToCents(149900)).toBe(14990000);
    });

    it("should generate unique references", () => {
      const ref1 = generateReference();
      const ref2 = generateReference();

      expect(ref1).not.toBe(ref2);
      expect(ref1).toMatch(/^JCV-[A-Z0-9]+-[A-Z0-9]+$/);
      expect(ref2).toMatch(/^JCV-[A-Z0-9]+-[A-Z0-9]+$/);
    });
  });
});
