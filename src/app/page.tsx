'use client';

import { useTranslation } from 'react-i18next';
import UploadCTA from '@/components/landing/UploadCTA';
import HowItWorks from '@/components/landing/HowItWorks';
import TrustSignals from '@/components/landing/TrustSignals';

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="bg-[var(--background)]">
      {/* Hero */}
      <section className="relative pt-10 sm:pt-16 md:pt-20 pb-8 sm:pb-12 px-4 overflow-hidden">
        {/* Subtle decorative element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[var(--primary)]/[0.02] blur-3xl pointer-events-none" />

        <div className="relative max-w-2xl mx-auto">
          {/* Eyebrow */}
          <p className="text-center text-[11px] text-[var(--primary)] tracking-[0.2em] uppercase font-medium mb-4 sm:mb-5">
            Vastu Shastra Analysis
          </p>

          {/* Headline */}
          <h1
            className="text-center text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--secondary)] mb-4 sm:mb-5 leading-[1.15]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {t('tagline')}
          </h1>

          {/* Subhead */}
          <p className="text-center text-sm sm:text-base md:text-lg text-stone-500 max-w-md mx-auto leading-relaxed mb-8 sm:mb-10">
            {t('subtitle')}
          </p>

          {/* Upload CTA */}
          <UploadCTA />
        </div>
      </section>

      {/* Social proof bar */}
      <section className="border-y border-stone-200/60 bg-white/50">
        <div className="max-w-3xl mx-auto px-4 py-4 sm:py-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs sm:text-sm text-stone-400">
          <span>100% Free</span>
          <span className="hidden sm:inline text-stone-200">|</span>
          <span>No Sign-up Required</span>
          <span className="hidden sm:inline text-stone-200">|</span>
          <span>Instant Results</span>
          <span className="hidden sm:inline text-stone-200">|</span>
          <span>PDF Report</span>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 max-w-3xl mx-auto">
        <HowItWorks />
      </section>

      {/* Trust Signals */}
      <section className="px-4 max-w-3xl mx-auto">
        <TrustSignals />
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-10 px-4 text-center border-t border-stone-200/60">
        <p className="text-[11px] text-stone-400 max-w-sm mx-auto leading-5">
          {t('disclaimer')}
        </p>
      </footer>
    </div>
  );
}
