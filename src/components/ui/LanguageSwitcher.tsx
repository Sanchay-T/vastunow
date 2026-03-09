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
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all duration-200 min-h-[40px] min-w-[40px] justify-center cursor-pointer"
      style={{
        color: 'var(--gold)',
        background: 'rgba(234,156,51,0.08)',
        border: '1px solid rgba(234,156,51,0.2)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(234,156,51,0.15)';
        e.currentTarget.style.borderColor = 'rgba(234,156,51,0.35)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(234,156,51,0.08)';
        e.currentTarget.style.borderColor = 'rgba(234,156,51,0.2)';
      }}
    >
      <Globe className="w-3.5 h-3.5" />
      <span>{i18n.language === 'en' ? 'हिंदी' : 'ENG'}</span>
    </button>
  );
}
