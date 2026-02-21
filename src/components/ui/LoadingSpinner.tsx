'use client';

import { useEffect, useState } from 'react';
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

  // 8 compass positions for dots on outer ring (radius 44)
  const outerDots = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 45 * Math.PI) / 180;
    return {
      cx: 50 + 44 * Math.cos(angle),
      cy: 50 + 44 * Math.sin(angle),
    };
  });

  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-10 px-4 w-full max-w-sm mx-auto">
      {/* Wordmark */}
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-xl sm:text-2xl font-bold tracking-tight mb-6 sm:mb-8"
        style={{ color: '#1e3a5f' }}
      >
        VastuNow
      </motion.h1>

      {/* Mandala spinner */}
      <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-6 sm:mb-8">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Outer ring - clockwise */}
          <motion.circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="#c2410c"
            strokeWidth="1.5"
            strokeOpacity="0.3"
            strokeDasharray="6 4"
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '50px 50px' }}
          />

          {/* Outer ring compass dots - rotate with outer ring */}
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '50px 50px' }}
          >
            {outerDots.map((dot, i) => (
              <circle
                key={i}
                cx={dot.cx}
                cy={dot.cy}
                r="2"
                fill="#c2410c"
                opacity={0.6}
              />
            ))}
          </motion.g>

          {/* Inner ring - counter-clockwise */}
          <motion.circle
            cx="50"
            cy="50"
            r="30"
            fill="none"
            stroke="#1e3a5f"
            strokeWidth="1.5"
            strokeOpacity="0.3"
            strokeDasharray="4 3"
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '50px 50px' }}
          />

          {/* Pulsing saffron center */}
          <motion.circle
            cx="50"
            cy="50"
            r="8"
            fill="#c2410c"
            animate={{ r: [8, 10, 8], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <circle cx="50" cy="50" r="4" fill="#fff" opacity={0.4} />
        </svg>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-[256px] mb-4">
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: '#c2410c1a' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: '#c2410c' }}
            initial={{ width: '0%' }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[11px] sm:text-xs" style={{ color: '#1e3a5f' }}>
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
          style={{ color: '#1e3a5f' }}
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
            <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5" style={{ color: '#c2410c' }} />
            <p className="text-sm sm:text-base text-gray-600 italic leading-snug">{facts[factIndex]}</p>
          </motion.div>
        </AnimatePresence>

        {/* Dot indicators */}
        <div className="flex gap-1.5 mt-3">
          {facts.map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
              style={{
                backgroundColor: i === factIndex ? '#c2410c' : '#c2410c33',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
