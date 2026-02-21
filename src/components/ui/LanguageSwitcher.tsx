'use client';

import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  onLanguageChange?: (lang: string) => void;
}

export default function LanguageSwitcher({ onLanguageChange }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
    onLanguageChange?.(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--secondary)] hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] justify-center"
    >
      <Globe className="w-4 h-4" />
      <span>{i18n.language === 'en' ? 'HI' : 'EN'}</span>
    </button>
  );
}
