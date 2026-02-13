import {
  Header,
  Hero,
  Footer,
  ProblemSection,
  FeaturesGrid,
  HowItWorks,
  SocialProof,
  FAQ,
  Guarantee,
  PDFShowcase,
} from "@/features/landing/components";
import { PricingSection } from "@/features/payment/components";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <ProblemSection />
        <FeaturesGrid />
        <HowItWorks />
        <PDFShowcase />
        <SocialProof />
        <PricingSection />
        <Guarantee />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
