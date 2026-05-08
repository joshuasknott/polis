import { LandingNav } from "@/components/landing/landing-nav";
import { HeroSandboxWorkspace } from "@/components/landing/hero-sandbox-workspace";
import { HowItWorksStack } from "@/components/landing/how-it-works-stack";
import { UseCasesSection } from "@/components/landing/use-cases-section";
import { GroundedGenerationSection } from "@/components/landing/grounded-generation-section";
import { CompetitorAnalysisSection } from "@/components/landing/competitor-analysis-section";
import { LandingFooter } from "@/components/landing/landing-footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#0f284d] antialiased">
      <LandingNav />
      <HeroSandboxWorkspace />
      <HowItWorksStack />
      <UseCasesSection />
      <GroundedGenerationSection />
      <CompetitorAnalysisSection />
      <LandingFooter />
    </div>
  );
}
