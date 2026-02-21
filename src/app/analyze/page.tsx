'use client';

import { useTranslation } from 'react-i18next';
import UploadZone from '@/components/analyze/UploadZone';

export default function AnalyzePage() {
  const { t } = useTranslation();

  return (
    <div className="mandala-bg min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <h1
          className="text-xl sm:text-2xl font-bold text-[var(--secondary)] text-center mb-2"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          {t('tagline')}
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 text-center mb-6 sm:mb-8">
          {t('subtitle')}
        </p>
        <UploadZone />
      </div>
    </div>
  );
}
