import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Check } from './icons';
import { COLORS } from '@/constants/colors';
import { FONTS } from '@/constants/theme';
import { CompassHousing, CompassNeedle } from './Compass';
import { GoldUnderline } from './Eyebrow';
import ProgressStepper from './ProgressStepper';

const DIAL = 196;

const CHECKLIST = [
  'Floor plan uploaded',
  'Detecting rooms and entrance',
  'Scoring against Vaastu rules',
  'Writing your report',
];

interface AnalyzingViewProps {
  /** 1-4: the checklist row currently in progress; earlier rows read as done. */
  step?: number;
  title?: string;
  subtitle?: string;
  /** Which flow step to highlight above the dial; omit to hide the stepper. */
  stepper?: 1 | 2 | 3;
}

/**
 * Full-screen working state. The dial face stays upright while only the needle
 * sweeps, so the direction names remain readable throughout.
 */
export default function AnalyzingView({
  step = 2,
  title = 'Reading your floor plan',
  subtitle = 'Identifying each room and mapping it to its Vaastu zone.',
  stepper,
}: AnalyzingViewProps) {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true }),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.9, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    spinLoop.start();
    pulseLoop.start();
    return () => { spinLoop.stop(); pulseLoop.stop(); };
  }, [spin, pulse]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.container}>
      {stepper ? (
        <View style={styles.stepperWrap}>
          <ProgressStepper currentStep={stepper} />
        </View>
      ) : null}

      <View style={{ width: DIAL, height: DIAL }}>
        <CompassHousing size={DIAL} />

        <Animated.View style={[StyleSheet.absoluteFill, { opacity: pulse }]} pointerEvents="none">
          <Svg width={DIAL} height={DIAL} viewBox="0 0 200 200">
            <Circle
              cx="100" cy="100" r="62" fill="none"
              stroke={COLORS.gold} strokeWidth="1.2"
              strokeDasharray="4 10" strokeLinecap="round"
            />
          </Svg>
        </Animated.View>

        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]} pointerEvents="none">
          <CompassNeedle size={DIAL} />
        </Animated.View>
      </View>

      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <GoldUnderline centered />
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.card}>
        {CHECKLIST.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const active = n === step;
          return (
            <View key={label} style={styles.row}>
              <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]}>
                {done ? <Check size={12} color={COLORS.white} strokeWidth={3} /> : null}
                {active ? <View style={styles.dotInner} /> : null}
              </View>
              <Text style={[styles.rowText, done && styles.rowTextDone, active && styles.rowTextActive]}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.footnote}>This usually takes 20–30 seconds.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 26, paddingHorizontal: 28, backgroundColor: COLORS.background,
  },
  stepperWrap: { width: '100%' },
  copy: { alignItems: 'center', gap: 8 },
  title: {
    fontFamily: FONTS.serifBold, fontSize: 23, color: COLORS.primary, textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.body, fontSize: 12, lineHeight: 20,
    color: 'rgba(45,41,38,0.6)', textAlign: 'center',
  },
  card: {
    width: '100%', backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, padding: 16, gap: 14,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  dotDone: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dotActive: { borderColor: COLORS.gold },
  dotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.gold },
  rowText: { fontFamily: FONTS.body, fontSize: 13, color: 'rgba(45,41,38,0.4)' },
  rowTextDone: { fontFamily: FONTS.medium, color: COLORS.foreground },
  rowTextActive: { fontFamily: FONTS.semibold, color: COLORS.foreground },
  footnote: { fontFamily: FONTS.body, fontSize: 11, color: 'rgba(45,41,38,0.45)', textAlign: 'center' },
});
