"use client";

import WavesBackground from "@/components/ui/waves-background";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { FloatingNav } from "@/components/landing/FloatingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { BentoFeatures } from "@/components/landing/BentoFeatures";
import { HorizontalScroll } from "@/components/landing/HorizontalScroll";
import { Testimonials } from "@/components/landing/Testimonials";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <SmoothScroll>
      <div className="app-background min-h-screen text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-100">
        {/* Existing animated deep-ocean gradient + WebGL wave/particle canvas — untouched, sits at -z-10 */}
        <WavesBackground />

        {/* Floating glass navigation */}
        <FloatingNav />

        {/* All sections render on top of the existing background with transparent/glass surfaces */}
        <main className="relative">
          <HeroSection />
          <BentoFeatures />
          <HorizontalScroll />
          <Testimonials />
          <FinalCTA />
          <Footer />
        </main>
      </div>
    </SmoothScroll>
  );
}
