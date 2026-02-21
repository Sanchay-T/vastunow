'use client';

import { useTranslation } from 'react-i18next';

export default function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    { num: '1', title: t('step_1_title'), desc: t('step_1_desc') },
    { num: '2', title: t('step_2_title'), desc: t('step_2_desc') },
    { num: '3', title: t('step_3_title'), desc: t('step_3_desc') },
  ];

  return (
    <section className="py-12 sm:py-16">
      <p className="text-[11px] text-stone-400 tracking-[0.15em] uppercase text-center mb-2">
        How It Works
      </p>
      <h2
        className="text-xl sm:text-2xl font-bold text-center text-[var(--secondary)] mb-8 sm:mb-12"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        Three simple steps
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 max-w-2xl md:max-w-none mx-auto">
        {steps.map((step, i) => (
          <div key={i} className="relative">
            {/* Connector line — only on desktop, between items */}
            {i < steps.length - 1 && (
              <div className="hidden md:block absolute top-5 left-[calc(50%+20px)] right-[calc(-50%+20px)] h-px bg-stone-200" />
            )}

            <div className="text-center relative">
              {/* Step number */}
              <div className="w-10 h-10 rounded-full border-2 border-[var(--primary)] flex items-center justify-center mx-auto mb-4">
                <span className="text-sm font-bold text-[var(--primary)]">{step.num}</span>
              </div>

              <h3 className="font-semibold text-[var(--secondary)] mb-1.5 text-sm sm:text-base">
                {step.title}
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 leading-relaxed max-w-[220px] mx-auto">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
