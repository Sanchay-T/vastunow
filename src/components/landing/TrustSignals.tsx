'use client';

import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { BookOpen, Clock, Cpu, Star } from 'lucide-react';

export default function TrustSignals() {
  const { t } = useTranslation();

  const signals = [
    {
      icon: BookOpen,
      label: t('trust_signal'),
      detail: 'Consensus across Vaastu schools',
    },
    {
      icon: Clock,
      label: '5,000+ Years of Tradition',
      detail: 'Rooted in Sthapatya Veda',
    },
    {
      icon: Cpu,
      label: 'AI-Powered Precision',
      detail: 'Advanced vision analysis',
    },
    {
      icon: Star,
      label: '100% Free to Use',
      detail: 'No hidden charges ever',
    },
  ];

  return (
    <section
      className="w-full relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #283171 0%, #1e2558 30%, #1a0a20 60%, #6E1126 100%)' }}
    >
      {/* Decorative compass watermark - left */}
      <div className="absolute top-0 left-0 -translate-x-1/3 -translate-y-1/4 pointer-events-none opacity-[0.04]">
        <Image
          src="/images/compass-gold.png"
          alt=""
          width={500}
          height={500}
          className="w-[500px] h-[500px]"
        />
      </div>
      {/* Decorative compass watermark - right */}
      <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 pointer-events-none opacity-[0.05]">
        <Image
          src="/images/compass-navy.png"
          alt=""
          width={450}
          height={450}
          className="w-[450px] h-[450px]"
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-14 sm:py-20 relative">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-10 sm:w-14 bg-gradient-to-r from-transparent to-[var(--gold)]/50" />
            <p className="text-[10px] sm:text-[11px] text-[var(--gold)] tracking-[0.3em] uppercase font-semibold">
              Why Trust Us
            </p>
            <div className="h-px w-10 sm:w-14 bg-gradient-to-l from-transparent to-[var(--gold)]/50" />
          </div>
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Built on Ancient Wisdom
          </h2>
          <p className="text-sm text-white/40 max-w-md mx-auto">
            Combining millennia of Vaastu Shastra knowledge with modern AI technology
          </p>
        </div>

        {/* Trust cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
          {signals.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="rounded-2xl p-5 sm:p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 backdrop-blur-sm"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                  border: '1px solid rgba(234,156,51,0.12)',
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(234,156,51,0.2), rgba(234,156,51,0.05))',
                    border: '1px solid rgba(234,156,51,0.25)',
                  }}
                >
                  <Icon className="w-6 h-6 text-[var(--gold)]" strokeWidth={1.8} />
                </div>
                <p
                  className="text-[13px] sm:text-sm font-bold text-white mb-1.5 leading-snug"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {s.label}
                </p>
                <p className="text-[11px] text-white/40 leading-relaxed">{s.detail}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
