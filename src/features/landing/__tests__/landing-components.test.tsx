import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProblemSection } from "../components/ProblemSection";
import { FeaturesGrid } from "../components/FeaturesGrid";
import { HowItWorks } from "../components/HowItWorks";
import { SocialProof } from "../components/SocialProof";
import { FAQ } from "../components/FAQ";
import { PDFShowcase } from "../components/PDFShowcase";

describe("Landing Page Components", () => {
  describe("ProblemSection", () => {
    it("renders the problem section with before/after comparison", () => {
      render(<ProblemSection />);

      expect(screen.getByText(/No basta con/)).toBeInTheDocument();
      expect(screen.getByText("Sin Plan")).toBeInTheDocument();
      expect(screen.getByText("Con JCV Fitness")).toBeInTheDocument();
      expect(screen.getByText("VS")).toBeInTheDocument();
    });

    it("displays benefits of using JCV Fitness", () => {
      render(<ProblemSection />);

      expect(screen.getByText("Plan 100% personalizado")).toBeInTheDocument();
      expect(screen.getByText("PDF profesional descargable")).toBeInTheDocument();
    });
  });

  describe("FeaturesGrid", () => {
    it("renders all 6 features", () => {
      render(<FeaturesGrid />);

      expect(screen.getByText("Tu Objetivo")).toBeInTheDocument();
      expect(screen.getByText("Plan de Ejercicios")).toBeInTheDocument();
      expect(screen.getByText("Plan Nutricional")).toBeInTheDocument();
      expect(screen.getByText("Calendario Semanal")).toBeInTheDocument();
      expect(screen.getByText("PDF Profesional")).toBeInTheDocument();
      expect(screen.getByText("Seguimiento")).toBeInTheDocument();
    });
  });

  describe("HowItWorks", () => {
    it("renders 3 steps", () => {
      render(<HowItWorks />);

      expect(screen.getByText("Completa el Wizard")).toBeInTheDocument();
      expect(screen.getByText("Generamos tu Plan")).toBeInTheDocument();
      expect(screen.getByText("Descarga tu PDF")).toBeInTheDocument();
    });

    it("has a CTA button", () => {
      render(<HowItWorks />);

      expect(screen.getByText("COMENZAR MI PLAN AHORA")).toBeInTheDocument();
    });
  });

  describe("SocialProof", () => {
    it("renders stats", () => {
      render(<SocialProof />);

      expect(screen.getByText("+500")).toBeInTheDocument();
      expect(screen.getByText("+1,200")).toBeInTheDocument();
      expect(screen.getByText("4.9")).toBeInTheDocument();
    });

    it("renders testimonials", () => {
      render(<SocialProof />);

      expect(screen.getByText("Maria Garcia")).toBeInTheDocument();
      expect(screen.getByText("Carlos Rodriguez")).toBeInTheDocument();
      expect(screen.getByText("Ana Martinez")).toBeInTheDocument();
    });
  });

  describe("FAQ", () => {
    it("renders FAQ questions", () => {
      render(<FAQ />);

      expect(screen.getByText("Como funciona el plan personalizado?")).toBeInTheDocument();
      expect(screen.getByText("Que incluye el PDF que descargo?")).toBeInTheDocument();
      expect(screen.getByText("Cuanto tiempo dura la suscripcion?")).toBeInTheDocument();
    });
  });

  describe("PDFShowcase", () => {
    it("renders PDF preview section", () => {
      render(<PDFShowcase />);

      expect(screen.getByText(/PDF PROFESIONAL/)).toBeInTheDocument();
      expect(screen.getByText("Portada Personalizada")).toBeInTheDocument();
      expect(screen.getByText("Plan de Entrenamiento")).toBeInTheDocument();
      expect(screen.getByText("Calendario Semanal")).toBeInTheDocument();
      expect(screen.getByText("Plan de Alimentacion")).toBeInTheDocument();
    });

    it("has CTA buttons", () => {
      render(<PDFShowcase />);

      expect(screen.getByText("VER EJEMPLO")).toBeInTheDocument();
      expect(screen.getByText("CREAR MI PLAN")).toBeInTheDocument();
    });
  });
});
