import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SpreadsheetHero } from "../SpreadsheetHero";
import { SpreadsheetFeatures } from "../SpreadsheetFeatures";
import { SpreadsheetBenefits } from "../SpreadsheetBenefits";
import { SpreadsheetHowItWorks } from "../SpreadsheetHowItWorks";
import { SpreadsheetVersions } from "../SpreadsheetVersions";
import { SpreadsheetPricing } from "../SpreadsheetPricing";
import { SpreadsheetCTA } from "../SpreadsheetCTA";

// Mock next/link to render a plain anchor
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("Spreadsheet Page Components", () => {
  describe("SpreadsheetHero", () => {
    it("renders the hero title with all keywords", () => {
      render(<SpreadsheetHero />);

      expect(screen.getByText("HOJA DE")).toBeInTheDocument();
      expect(screen.getByText("EVALUACION")).toBeInTheDocument();
      expect(screen.getByText("FISICA")).toBeInTheDocument();
      expect(screen.getByText("PROFESIONAL")).toBeInTheDocument();
    });

    it("renders the subtitle text", () => {
      render(<SpreadsheetHero />);

      expect(
        screen.getByText(
          "La herramienta definitiva para entrenadores que quieren destacar"
        )
      ).toBeInTheDocument();
    });

    it("renders CTA buttons", () => {
      render(<SpreadsheetHero />);

      expect(screen.getByText("DESCARGAR AHORA")).toBeInTheDocument();
      expect(screen.getByText("Ver que incluye")).toBeInTheDocument();
    });

    it("renders trust indicators", () => {
      render(<SpreadsheetHero />);

      expect(
        screen.getByText("Compatible con Excel y Google Sheets")
      ).toBeInTheDocument();
      expect(screen.getByText("4 versiones incluidas")).toBeInTheDocument();
      expect(
        screen.getByText("Calculos 100% automaticos")
      ).toBeInTheDocument();
    });

    it("renders the professional badge", () => {
      render(<SpreadsheetHero />);

      expect(
        screen.getByText("Herramienta para entrenadores profesionales")
      ).toBeInTheDocument();
    });
  });

  describe("SpreadsheetFeatures", () => {
    it("renders all 8 features", () => {
      render(<SpreadsheetFeatures />);

      expect(
        screen.getByText("Evaluacion Antropometrica")
      ).toBeInTheDocument();
      expect(screen.getByText("Grasa Corporal")).toBeInTheDocument();
      expect(screen.getByText("Perimetria Completa")).toBeInTheDocument();
      expect(screen.getByText("Composicion Corporal")).toBeInTheDocument();
      expect(screen.getByText("Anamnesis del Cliente")).toBeInTheDocument();
      expect(screen.getByText("Graficos Comparativos")).toBeInTheDocument();
      expect(
        screen.getByText("Informe PDF Profesional")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Seguimiento con Fotos")
      ).toBeInTheDocument();
    });

    it("renders section heading", () => {
      render(<SpreadsheetFeatures />);

      expect(screen.getByText("INCLUYE")).toBeInTheDocument();
    });
  });

  describe("SpreadsheetBenefits", () => {
    it("renders all 4 benefits", () => {
      render(<SpreadsheetBenefits />);

      expect(
        screen.getByText("Impresiona a tus clientes")
      ).toBeInTheDocument();
      expect(screen.getByText("Ahorra tiempo")).toBeInTheDocument();
      expect(screen.getByText("Destaca como experto")).toBeInTheDocument();
      expect(
        screen.getByText("Funciona en todo dispositivo")
      ).toBeInTheDocument();
    });

    it("renders section heading", () => {
      render(<SpreadsheetBenefits />);

      expect(screen.getByText("NECESITAS")).toBeInTheDocument();
    });

    it("renders numbered benefit indicators", () => {
      render(<SpreadsheetBenefits />);

      expect(screen.getByText("01")).toBeInTheDocument();
      expect(screen.getByText("02")).toBeInTheDocument();
      expect(screen.getByText("03")).toBeInTheDocument();
      expect(screen.getByText("04")).toBeInTheDocument();
    });
  });

  describe("SpreadsheetHowItWorks", () => {
    it("renders 3 steps", () => {
      render(<SpreadsheetHowItWorks />);

      expect(screen.getByText("Ingresa los datos")).toBeInTheDocument();
      expect(screen.getByText("Calculos automaticos")).toBeInTheDocument();
      expect(screen.getByText("Descarga el informe")).toBeInTheDocument();
    });

    it("renders step numbers", () => {
      render(<SpreadsheetHowItWorks />);

      expect(screen.getByText("Paso 01")).toBeInTheDocument();
      expect(screen.getByText("Paso 02")).toBeInTheDocument();
      expect(screen.getByText("Paso 03")).toBeInTheDocument();
    });

    it("renders section heading", () => {
      render(<SpreadsheetHowItWorks />);

      expect(screen.getByText("FUNCIONA")).toBeInTheDocument();
    });
  });

  describe("SpreadsheetVersions", () => {
    it("renders all 4 version cards", () => {
      render(<SpreadsheetVersions />);

      expect(
        screen.getByText("Masculino + Adipometro")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Femenino + Adipometro")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Masculino + Bioimpedancia")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Femenino + Bioimpedancia")
      ).toBeInTheDocument();
    });

    it("renders section heading with version count", () => {
      render(<SpreadsheetVersions />);

      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("VERSIONES")).toBeInTheDocument();
    });

    it("renders version subtitles", () => {
      render(<SpreadsheetVersions />);

      const pollock = screen.getAllByText("Metodo Pollock 7 pliegues");
      expect(pollock).toHaveLength(2);

      const bio = screen.getAllByText("Datos de balanza inteligente");
      expect(bio).toHaveLength(2);
    });

    it("renders features for each version", () => {
      render(<SpreadsheetVersions />);

      // Each version has "Composicion corporal" and "Graficos de progreso"
      const composicion = screen.getAllByText("Composicion corporal");
      expect(composicion).toHaveLength(4);

      const graficos = screen.getAllByText("Graficos de progreso");
      expect(graficos).toHaveLength(4);
    });
  });

  describe("SpreadsheetPricing", () => {
    it("renders both pricing plans", () => {
      render(<SpreadsheetPricing />);

      expect(
        screen.getByText("Suscriptor JCV Fitness")
      ).toBeInTheDocument();
      expect(screen.getByText("Compra unica")).toBeInTheDocument();
    });

    it("renders subscriber plan as free", () => {
      render(<SpreadsheetPricing />);

      expect(screen.getByText("GRATIS")).toBeInTheDocument();
      expect(screen.getByText("RECOMENDADO")).toBeInTheDocument();
    });

    it("renders one-time purchase price", () => {
      render(<SpreadsheetPricing />);

      expect(screen.getByText("$29.900")).toBeInTheDocument();
      expect(screen.getByText("$49.900")).toBeInTheDocument();
    });

    it("renders subscriber features", () => {
      render(<SpreadsheetPricing />);

      expect(
        screen.getByText("Soporte prioritario por WhatsApp")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Tutoriales en video exclusivos")
      ).toBeInTheDocument();
    });

    it("renders CTA buttons", () => {
      render(<SpreadsheetPricing />);

      expect(screen.getByText("Suscribirme ahora")).toBeInTheDocument();
      expect(screen.getByText("Comprar ahora")).toBeInTheDocument();
    });

    it("renders section heading", () => {
      render(<SpreadsheetPricing />);

      expect(screen.getByText("PLAN")).toBeInTheDocument();
    });
  });

  describe("SpreadsheetCTA", () => {
    it("renders download CTA section", () => {
      render(<SpreadsheetCTA />);

      expect(screen.getByText(/Descarga tu hoja de/)).toBeInTheDocument();
      expect(screen.getByText("evaluacion")).toBeInTheDocument();
    });

    it("renders CTA button", () => {
      render(<SpreadsheetCTA />);

      expect(screen.getByText("DESCARGAR AHORA")).toBeInTheDocument();
    });

    it("renders trust note about compatibility", () => {
      render(<SpreadsheetCTA />);

      expect(
        screen.getByText(
          /Compatible con Google Sheets y Microsoft Excel/
        )
      ).toBeInTheDocument();
    });

    it("renders motivational subtitle", () => {
      render(<SpreadsheetCTA />);

      expect(
        screen.getByText(
          /Empieza a evaluar a tus clientes como un profesional/
        )
      ).toBeInTheDocument();
    });
  });
});
