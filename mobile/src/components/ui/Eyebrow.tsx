import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { COLORS } from '@/constants/colors';
import { FONTS } from '@/constants/theme';

/** A hairline that fades out towards `fadeTo`. */
export function GradientRule({ fadeTo = 'left', color = COLORS.gold }: { fadeTo?: 'left' | 'right'; color?: string }) {
  const id = `rule-${fadeTo}`;
  return (
    <View style={styles.ruleWrap}>
      <Svg width="100%" height={1}>
        <Defs>
          <LinearGradient id={id} x1={fadeTo === 'left' ? '0' : '1'} y1="0" x2={fadeTo === 'left' ? '1' : '0'} y2="0">
            <Stop offset="0" stopColor={color} stopOpacity="0" />
            <Stop offset="1" stopColor={color} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="1" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/** Gold micro-label flanked by fading rules — the site's section marker. */
export default function Eyebrow({ label }: { label: string }) {
  return (
    <View style={styles.row}>
      <GradientRule fadeTo="left" />
      <Text style={styles.text}>{label}</Text>
      <GradientRule fadeTo="right" />
    </View>
  );
}

/** Neutral rule pair used for in-page section headings. */
export function SectionLabel({ label }: { label: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.plainRule} />
      <Text style={styles.sectionText}>{label}</Text>
      <View style={styles.plainRule} />
    </View>
  );
}

/** The short gold underline that sits below display headings. */
export function GoldUnderline({ centered = false }: { centered?: boolean }) {
  return (
    <View style={{ alignItems: centered ? 'center' : 'flex-start' }}>
      <View style={styles.underline}>
        <Svg width="100%" height={2}>
          <Defs>
            <LinearGradient id="underline" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={COLORS.gold} stopOpacity="1" />
              <Stop offset="1" stopColor={COLORS.gold} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="2" fill="url(#underline)" />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ruleWrap: { flex: 1, height: 1 },
  plainRule: { flex: 1, height: 1, backgroundColor: COLORS.border },
  text: {
    fontFamily: FONTS.semibold, fontSize: 10, color: COLORS.gold,
    letterSpacing: 3, textTransform: 'uppercase',
  },
  sectionText: {
    fontFamily: FONTS.semibold, fontSize: 10, color: COLORS.secondary,
    letterSpacing: 2.2, textTransform: 'uppercase',
  },
  underline: { width: 64, height: 2 },
});
