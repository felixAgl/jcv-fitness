import type { Metadata } from "next";
import { Header, Footer } from "@/features/landing/components";
import {
  SpreadsheetHero,
  SpreadsheetFeatures,
  SpreadsheetBenefits,
  SpreadsheetHowItWorks,
  SpreadsheetVersions,
  SpreadsheetPricing,
  SpreadsheetCTA,
} from "@/features/spreadsheet/components";

export const metadata: Metadata = {
  title: "Hoja de Evaluacion Fisica Profesional | JCV 24 Fitness",
  description:
    "La herramienta definitiva para entrenadores. Evaluacion antropometrica, grasa corporal, perimetria, composicion corporal e informes PDF profesionales.",
};

export default function SpreadsheetPage() {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main>
        <SpreadsheetHero />
        <SpreadsheetFeatures />
        <SpreadsheetBenefits />
        <SpreadsheetHowItWorks />
        <SpreadsheetVersions />
        <SpreadsheetPricing />
        <SpreadsheetCTA />
      </main>
      <Footer />
    </div>
  );
}
