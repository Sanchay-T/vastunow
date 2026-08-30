import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Svg, Circle, G, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import type { AnalysisResult } from '@/lib/types/vastu';

function useCountUp(target: number, duration = 1500): number {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let rafId: number;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [target, duration]);

  return current;
}

function getScoreInfo(score: number) {
  if (score >= 80) return { color: '#22c55e', label: 'Excellent' };
  if (score >= 70) return { color: '#65a30d', label: 'Good' };
  if (score >= 55) return { color: '#d97706', label: 'Fair' };
  if (score >= 40) return { color: '#ea580c', label: 'Below Average' };
  return { color: '#dc2626', label: 'Needs Work' };
}

interface ScoreCardProps {
  score: number;
  grade: string;
  summary?: string;
}

export default function ScoreCard({ score, grade, summary }: ScoreCardProps) {
  const { t } = useTranslation();
  const info = getScoreInfo(score);
  const displayScore = useCountUp(score);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.gaugeContainer}>
          <Svg width={120} height={120}>
            <Circle cx={60} cy={60} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={6} />
            <Circle
              cx={60} cy={60} r={radius}
              fill="none"
              stroke={info.color}
              strokeWidth={6}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              rotation={-90}
              originX={60}
              originY={60}
            />
          </Svg>
          <View style={styles.gaugeCenter}>
            <Text style={[styles.scoreNumber, { color: info.color }]}>
              {displayScore}
            </Text>
          </View>
        </View>

        <View style={styles.gradeContainer}>
          <Text style={styles.gradeLabel}>{t('grade')}</Text>
          <Text style={[styles.gradeLetter, { color: info.color }]}>{grade}</Text>
          <Text style={[styles.gradeDescriptor, { color: info.color }]}>{info.label}</Text>
        </View>
      </View>

      {summary && (
        <Text style={styles.summary}>{summary}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 16,
  },
  gaugeContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  gradeContainer: {
    gap: 4,
  },
  gradeLabel: {
    fontSize: 11,
    color: '#9ca3af',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  gradeLetter: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 52,
  },
  gradeDescriptor: {
    fontSize: 14,
    fontWeight: '500',
  },
  summary: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 24,
    maxWidth: 340,
  },
});
