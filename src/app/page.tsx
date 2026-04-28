'use client';

import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { BadgeCheck, ShieldCheck, Zap, FileText } from 'lucide-react';
import UploadCTA from '@/components/landing/UploadCTA';
import HowItWorks from '@/components/landing/HowItWorks';
import TrustSignals from '@/components/landing/TrustSignals';
import ScrollingBorder from '@/components/ui/ScrollingBorder';

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="bg-[var(--background)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Gold compass watermark - right side */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/3 pointer-events-none opacity-[0.06] hidden md:block">
          <Image
            src="/images/compass-gold.png"
            alt=""
            width={600}
            height={600}
            className="w-[600px] h-[600px]"
            priority
          />
        </div>

        {/* Subtle sacred pattern */}
        <div className="absolute inset-0 sacred-pattern pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 md:pt-20 pb-10 sm:pb-14">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Left side - Text content */}
            <div className="flex-1 text-center md:text-left">
              {/* Eyebrow */}
              <div className="flex items-center justify-center md:justify-start gap-3 mb-5">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-[var(--gold)]" />
                <p className="text-[10px] sm:text-[11px] text-[var(--gold)] tracking-[0.3em] uppercase font-semibold">
                  Vaastu Shastra Analysis
                </p>
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-[var(--gold)]" />
              </div>

              {/* Headline */}
              <h1
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--primary)] mb-4 leading-[1.15]"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                {t('tagline')}
              </h1>

              {/* Gold divider */}
              <div className="flex justify-center md:justify-start mb-4">
                <div className="w-16 h-0.5 bg-gradient-to-r from-[var(--gold)] via-[var(--gold)] to-transparent" />
              </div>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-[var(--foreground)]/70 max-w-md mx-auto md:mx-0 leading-relaxed mb-8">
                {t('subtitle')}
              </p>

              {/* Quick trust badges - on-brand pills */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                {[
                  { icon: BadgeCheck, label: '100% Free',       color: 'var(--gold)' },
                  { icon: ShieldCheck, label: 'No Sign-up',     color: 'var(--secondary)' },
                  { icon: Zap, label: 'Instant Results',        color: 'var(--primary)' },
                  { icon: FileText, label: 'PDF Report',        color: 'var(--gold)' },
                ].map(({ icon: Icon, label, color }) => (
                  <div
                    key={label}
                    className="group flex items-center gap-1.5 backdrop-blur-sm border rounded-full pl-1.5 pr-3 py-1 hover:shadow-sm transition-all bg-white/70 hover:bg-white"
                    style={{
                      borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
                    }}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)`,
                      }}
                    >
                      <Icon className="w-2.5 h-2.5" strokeWidth={2.5} style={{ color }} />
                    </span>
                    <span className="text-[11px] font-semibold text-[var(--foreground)]/80 tracking-wide">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side - Mascot illustration */}
            <div className="shrink-0 relative">
              <div className="relative w-52 h-52 sm:w-64 sm:h-64 md:w-72 md:h-72">
                <Image
                  src="/images/logo-full-maroon.png"
                  alt="My Vaastu Pandit - Analyse. Remedy. Prosper."
                  width={400}
                  height={400}
                  className="w-full h-full object-contain drop-shadow-md"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scrolling decorative border */}
      <ScrollingBorder src="/images/border-maroon.png" speed={25} direction="left" />

      {/* Upload CTA Section */}
      <section className="relative py-12 sm:py-16 px-4 sm:px-6">
        <div className="relative max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            {/* Left side — info panel */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-[var(--gold)]" />
                <p className="text-[10px] sm:text-[11px] text-[var(--gold)] tracking-[0.3em] uppercase font-semibold">
                  Get Started
                </p>
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-[var(--gold)]" />
              </div>
              <h2
                className="text-2xl sm:text-3xl font-bold text-[var(--secondary)] mb-3"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Upload Your Floor Plan
              </h2>
              <p className="text-sm text-[var(--foreground)]/60 mb-6 max-w-sm mx-auto lg:mx-0 leading-relaxed">
                Upload a clear image of your floor plan and select the facing direction. Our AI will analyse it based on ancient Vaastu Shastra principles.
              </p>

              {/* Steps mini-guide */}
              <div className="space-y-3 max-w-xs mx-auto lg:mx-0">
                {[
                  { num: '1', text: 'Upload your floor plan image or PDF' },
                  { num: '2', text: 'Select the main entrance direction' },
                  { num: '3', text: 'Get your detailed Vaastu report' },
                ].map((step) => (
                  <div key={step.num} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[var(--primary)] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {step.num}
                    </span>
                    <span className="text-xs sm:text-sm text-[var(--foreground)]/70">{step.text}</span>
                  </div>
                ))}
              </div>

              {/* Compass watermark */}
              <div className="hidden lg:block mt-8 opacity-10">
                <Image
                  src="/images/compass-maroon.png"
                  alt=""
                  width={180}
                  height={180}
                  className="w-44 h-44"
                />
              </div>
            </div>

            {/* Right side — Upload card */}
            <div className="w-full max-w-md">
              <UploadCTA />
            </div>
          </div>
        </div>
      </section>

      {/* Scrolling gold border */}
      <ScrollingBorder src="/images/border-gold.png" speed={35} direction="right" />

      {/* How It Works */}
      <section className="px-4 sm:px-6 max-w-5xl mx-auto">
        <HowItWorks />
      </section>

      {/* Trust Signals — full width */}
      <TrustSignals />

      {/* Scrolling maroon border before footer */}
      <ScrollingBorder src="/images/border-maroon.png" speed={25} direction="left" />

      {/* Footer */}
      <footer className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #6E1126 0%, #4a0c1a 40%, #1a0a20 70%, #283171 100%)' }}>
        {/* Decorative compass watermark - left */}
        <div className="absolute top-0 left-0 -translate-x-1/3 -translate-y-1/4 pointer-events-none opacity-[0.04]">
          <Image src="/images/compass-gold.png" alt="" width={500} height={500} className="w-[500px] h-[500px]" />
        </div>
        {/* Decorative compass watermark - right */}
        <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/4 pointer-events-none opacity-[0.04]">
          <Image src="/images/compass-gold.png" alt="" width={400} height={400} className="w-[400px] h-[400px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-8">
          {/* Top section */}
          <div className="pt-14 sm:pt-20 pb-10 sm:pb-14 flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-16">
            {/* Left — Brand */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1">
              <Image
                src="/images/mascot.png"
                alt="My Vaastu Pandit"
                width={80}
                height={80}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain mb-4"
              />
              <Image
                src="/images/text-logo-white.png"
                alt="My Vaastu Pandit"
                width={220}
                height={50}
                className="h-8 sm:h-10 w-auto object-contain mb-4"
              />
              <p className="text-white/50 text-sm leading-relaxed max-w-sm">
                Bringing the ancient science of Vaastu Shastra into the modern world with AI-powered floor plan analysis.
              </p>
            </div>

            {/* Middle — Quick Links */}
            <div className="flex flex-col items-center md:items-start gap-3">
              <h4
                className="text-[var(--gold)] text-xs tracking-[0.2em] uppercase font-semibold mb-1"
              >
                Quick Links
              </h4>
              {['Home', 'Upload Floor Plan', 'How It Works'].map((link) => (
                <span key={link} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">
                  {link}
                </span>
              ))}
            </div>

            {/* Right — Knowledge */}
            <div className="flex flex-col items-center md:items-start gap-3">
              <h4
                className="text-[var(--gold)] text-xs tracking-[0.2em] uppercase font-semibold mb-1"
              >
                Vaastu Knowledge
              </h4>
              {['What is Vaastu Shastra?', 'Importance of Directions', 'Room Placement Guide', 'Remedies & Solutions'].map((link) => (
                <span key={link} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">
                  {link}
                </span>
              ))}
            </div>
          </div>

          {/* Gold divider line */}
          <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(234,156,51,0.3), rgba(234,156,51,0.5), rgba(234,156,51,0.3), transparent)' }} />

          {/* Bottom bar */}
          <div className="py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-white/30 max-w-md leading-5 text-center sm:text-left">
              {t('disclaimer')}
            </p>
            <p className="text-[11px] text-white/30 shrink-0">
              &copy; {new Date().getFullYear()} My Vaastu Pandit. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
