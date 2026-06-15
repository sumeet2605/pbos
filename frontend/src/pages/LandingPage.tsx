import { EarlyAccessSection } from '@/components/landing/EarlyAccessSection'
import { GenreWorkflowsSection } from '@/components/landing/GenreWorkflowsSection'
import { HeroSection } from '@/components/landing/HeroSection'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { IndiaFirstSection } from '@/components/landing/IndiaFirstSection'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { LandingNav } from '@/components/landing/LandingNav'
import { PainSection } from '@/components/landing/PainSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { WhatsAppSection } from '@/components/landing/WhatsAppSection'

export function LandingPage() {
  return (
    <div className="landing-page">
      <LandingNav />
      <HeroSection />
      <PainSection />
      <HowItWorksSection />
      <GenreWorkflowsSection />
      <WhatsAppSection />
      <IndiaFirstSection />
      <PricingSection />
      <EarlyAccessSection />
      <LandingFooter />
    </div>
  )
}
