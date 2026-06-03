import { useLayoutEffect } from 'react';
import { Header } from '../components/landing/Header';
import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { PricingSection } from '../components/landing/PricingSection';
import { ExperienceSection } from '../components/landing/ExperienceSection';
import { FAQSection } from '../components/landing/FAQSection';
import { CTASection } from '../components/landing/CTASection';
import { TrendingSection } from '../components/landing/TrendingSection';
import { BrandHubSection } from '../components/landing/BrandHubSection';
import Footer from '../components/Footer';

export default function Landing() {
  useLayoutEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'auto' });
      }
    }
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden noise bg-sf-base text-sf-text selection:bg-sf-accent selection:text-[#060611]">
      {/* Background base */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#03030A] via-black to-[#03030A]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        
        <HeroSection />
        
        <div id="trending">
          <TrendingSection />
        </div>
        
        <div id="brands">
          <BrandHubSection />
        </div>
        
        <div id="features">
          <FeaturesSection />
        </div>
        
        <div id="pricing">
          <PricingSection />
        </div>
        
        <div id="experience">
          <ExperienceSection />
        </div>
        
        <div id="faq">
          <FAQSection />
        </div>
        
        <CTASection />
        
        <Footer />
      </div>
    </main>
  );
}
