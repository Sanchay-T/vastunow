'use client';

import { useTranslation } from 'react-i18next';

export default function TrustSignals() {
  const { t } = useTranslation();

  const signals = [
    { label: t('trust_signal'), detail: 'Consensus across Vastu schools' },
    { label: '5,000+ years of tradition', detail: 'Rooted in Sthapatya Veda' },
    { label: 'AI-powered precision', detail: 'Claude vision analysis' },
  ];

  return (
    <section className="py-10 sm:py-14 border-t border-stone-200/60">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-2xl sm:max-w-none mx-auto">
        {signals.map((s, i) => (
          <div key={i} className="text-center">
            <p className="text-sm font-medium text-[var(--secondary)]">{s.label}</p>
            <p className="text-xs text-stone-400 mt-0.5">{s.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
