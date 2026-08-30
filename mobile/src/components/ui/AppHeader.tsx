import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@/constants/colors';
import { FONTS, HEADER_HEIGHT } from '@/constants/theme';

const MASCOT = require('../../../assets/images/mascot.png');

/**
 * The brand bar carried by every screen. The gradient is drawn with SVG rather
 * than a native gradient module so the whole header can ship as an OTA update.
 */
export default function AppHeader() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { i18n } = useTranslation();

  const isHindi = i18n.language === 'hi';
  const next = isHindi ? 'EN' : 'हिं';

  const toggleLanguage = () => {
    i18n.changeLanguage(isHindi ? 'en' : 'hi');
  };

  const totalHeight = HEADER_HEIGHT + insets.top;

  return (
    <View style={[styles.wrap, { height: totalHeight, paddingTop: insets.top }]}>
      <Svg style={StyleSheet.absoluteFill} width={width} height={totalHeight}>
        <Defs>
          {/* userSpaceOnUse keeps the 135° sweep true; bounding-box units would
              flatten it across the header's very wide, short box. */}
          <LinearGradient
            id="hdr" gradientUnits="userSpaceOnUse"
            x1={0} y1={0} x2={width} y2={width}
          >
            <Stop offset="0" stopColor="#6E1126" />
            <Stop offset="0.35" stopColor="#4a0c1a" />
            <Stop offset="0.7" stopColor="#1a0a20" />
            <Stop offset="1" stopColor="#283171" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={totalHeight} fill="url(#hdr)" />
      </Svg>

      <View style={styles.goldTop} />

      <View style={styles.row}>
        <TouchableOpacity
          onPress={() => router.dismissTo('/')}
          style={styles.brand}
          accessibilityRole="button"
          accessibilityLabel="My Vaastu Pandit, go to home"
        >
          <Image source={MASCOT} style={styles.mascot} resizeMode="contain" />
          <View>
            <Text style={styles.name}>My Vaastu Pandit</Text>
            <View style={styles.brandRule} />
            <Text style={styles.tagline}>Analyse · Remedy · Prosper</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleLanguage}
          style={styles.langPill}
          accessibilityRole="button"
          accessibilityLabel={isHindi ? 'Switch to English' : 'हिंदी में देखें'}
        >
          <Text style={styles.langText}>{next}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.goldBottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', overflow: 'hidden' },
  goldTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1,
    backgroundColor: 'rgba(234,156,51,0.55)',
  },
  goldBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
    backgroundColor: 'rgba(234,156,51,0.4)',
  },
  row: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mascot: { width: 40, height: 40 },
  name: {
    fontFamily: FONTS.serifBold, fontSize: 15, color: COLORS.white, letterSpacing: 0.2,
  },
  brandRule: {
    height: 1, marginVertical: 3, backgroundColor: 'rgba(234,156,51,0.45)',
  },
  tagline: {
    fontFamily: FONTS.semibold, fontSize: 7, color: COLORS.gold,
    letterSpacing: 2, textTransform: 'uppercase',
  },
  langPill: {
    minWidth: 44, height: 44, paddingHorizontal: 12, borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  langText: {
    fontFamily: FONTS.semibold, fontSize: 11, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.9,
  },
});
