'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb } from 'lucide-react';

interface LoadingSpinnerProps {
  step?: number; // 1 or 2
}

export default function LoadingSpinner({ step = 1 }: LoadingSpinnerProps) {
  const { t } = useTranslation();
  const [factIndex, setFactIndex] = useState(0);

  const facts = [
    t('vastu_fact_1'),
    t('vastu_fact_2'),
    t('vastu_fact_3'),
    t('vastu_fact_4'),
    t('vastu_fact_5'),
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex(prev => (prev + 1) % facts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [facts.length]);

  const progressPercent = step >= 2 ? 100 : 50;

  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-10 px-4 w-full max-w-sm mx-auto">
      {/* Brand mascot */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-4 sm:mb-6"
      >
        <Image
          src="/images/logo-full-maroon.png"
          alt="My Vaastu Pandit"
          width={160}
          height={160}
          priority
          className="w-32 h-32 sm:w-40 sm:h-40 object-contain"
        />
      </motion.div>

      {/* Spinning compass */}
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-6 sm:mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          className="w-full h-full"
        >
          <Image
            src="/images/compass-maroon.png"
            alt=""
            width={96}
            height={96}
            className="w-full h-full object-contain opacity-60"
          />
        </motion.div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-[256px] mb-4">
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: '#6E11261a' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: '#6E1126' }}
            initial={{ width: '0%' }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[11px] sm:text-xs" style={{ color: '#283171' }}>
          <span className={step >= 1 ? 'font-semibold' : 'opacity-50'}>
            {t('loading_step_1')}
          </span>
          <span className={step >= 2 ? 'font-semibold' : 'opacity-50'}>
            {t('loading_step_2')}
          </span>
        </div>
      </div>

      {/* Step description */}
      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="text-xs sm:text-sm mb-4 sm:mb-6 text-center"
          style={{ color: '#283171' }}
        >
          {step >= 2 ? t('loading_step_2') : t('loading_step_1')}
        </motion.p>
      </AnimatePresence>

      {/* Vastu facts */}
      <div className="min-h-[80px] flex flex-col items-center justify-center w-full max-w-xs sm:max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={factIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-2 text-center px-1 sm:px-2"
          >
            <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5" style={{ color: '#EA9C33' }} />
            <p className="text-sm sm:text-base text-[var(--foreground)]/60 italic leading-snug">{facts[factIndex]}</p>
          </motion.div>
        </AnimatePresence>

        {/* Dot indicators */}
        <div className="flex gap-1.5 mt-3">
          {facts.map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
              style={{
                backgroundColor: i === factIndex ? '#6E1126' : '#6E112633',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
