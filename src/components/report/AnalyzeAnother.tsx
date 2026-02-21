'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { PlusCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function AnalyzeAnother() {
  const { t } = useTranslation();

  return (
    <Link href="/analyze">
      <Button variant="outline" size="lg" className="w-full text-base sm:text-lg">
        <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
        {t('analyze_another')}
      </Button>
    </Link>
  );
}
