'use client';

import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { Upload, Search, FileCheck, ArrowRight } from 'lucide-react';

export default function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    { num: '1', title: t('step_1_title'), desc: t('step_1_desc'), icon: Upload, gradient: 'from-[#6E1126] to-[#8a1a33]' },
    { num: '2', title: t('step_2_title'), desc: t('step_2_desc'), icon: Search, gradient: 'from-[#714B9D] to-[#8b65b5]' },
    { num: '3', title: t('step_3_title'), desc: t('step_3_desc'), icon: FileCheck, gradient: 'from-[#283171] to-[#3a4590]' },
  ];

  return (
    <section className="py-16 sm:py-24 relative">
      {/* Section header */}
      <div className="text-center mb-14 sm:mb-18 relative">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-px w-10 sm:w-16 bg-gradient-to-r from-transparent to-[var(--gold)]" />
          <Image
            src="/images/compass-gold.png"
            alt=""
            width={24}
            height={24}
            className="w-5 h-5 opacity-60"
          />
          <div className="h-px w-10 sm:w-16 bg-gradient-to-l from-transparent to-[var(--gold)]" />
        </div>
        <h2
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--primary)] mb-2"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          How It Works
        </h2>
        <p className="text-sm text-[var(--foreground)]/50">Three simple steps to your Vaastu analysis</p>
      </div>

      {/* Steps */}
      <div className="max-w-4xl mx-auto relative">
        {/* Connector line behind cards - desktop */}
        <div className="hidden md:block absolute top-[52px] left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-[var(--primary)]/20 via-[var(--accent)]/20 to-[var(--secondary)]/20" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="relative group">
                <div className="flex flex-col items-center text-center">
                  {/* Number + Icon circle */}
                  <div className="relative mb-6">
                    <div className={`w-[104px] h-[104px] rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                      <Icon className="w-10 h-10 text-white" strokeWidth={1.5} />
                    </div>
                    {/* Step number badge */}
                    <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-[var(--gold)] text-white text-sm font-bold flex items-center justify-center shadow-md border-2 border-white">
                      {step.num}
                    </div>
                  </div>

                  {/* Arrow between steps - mobile */}
                  {i < steps.length - 1 && (
                    <div className="md:hidden my-1 mb-5">
                      <ArrowRight className="w-5 h-5 text-[var(--gold)] rotate-90" />
                    </div>
                  )}

                  {/* Content */}
                  <h3
                    className="font-bold text-[var(--secondary)] mb-2 text-lg"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-sm text-[var(--foreground)]/55 leading-relaxed max-w-[240px]">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
