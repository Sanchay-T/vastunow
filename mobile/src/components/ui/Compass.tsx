import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, Animated, Easing, GestureResponderEvent } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { COLORS } from '@/constants/colors';
import { FONTS, DIRECTION_NAMES } from '@/constants/theme';

export const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
export type Direction = (typeof DIRECTIONS)[number];

/** Clockwise from North, matching the compass rose. */
const ANGLE: Record<string, number> = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };

/** Tick marks sit just inside the rim, one per direction. */
const TICKS = DIRECTIONS.map((_, i) => {
  const rad = (i * 45 * Math.PI) / 180;
  return {
    x1: 100 + 92 * Math.sin(rad), y1: 100 - 92 * Math.cos(rad),
    x2: 100 + 98 * Math.sin(rad), y2: 100 - 98 * Math.cos(rad),
  };
});

/**
 * The dial face: rim, guide rings, ticks and the eight direction names.
 * Always drawn upright so the labels stay readable while a needle turns.
 */
export function CompassHousing({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Circle cx="100" cy="100" r="99" fill={COLORS.white} stroke={COLORS.border} strokeWidth="1" />
      <Circle cx="100" cy="100" r="80" fill="none" stroke={COLORS.primary} strokeOpacity="0.08" strokeWidth="0.8" />
      <Circle cx="100" cy="100" r="58" fill="none" stroke={COLORS.primary} strokeOpacity="0.08" strokeWidth="0.8" />
      <Circle cx="100" cy="100" r="34" fill="none" stroke={COLORS.primary} strokeOpacity="0.08" strokeWidth="0.8" />

      <G stroke={COLORS.primary} strokeOpacity="0.35" strokeWidth="1.4" strokeLinecap="round">
        {TICKS.map((t, i) => (
          <Line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
        ))}
      </G>

      <SvgText x="100" y="24" fontSize="15" fontWeight="700" fill={COLORS.gold} textAnchor="middle" fontFamily={FONTS.bold}>N</SvgText>
      <SvgText x="100" y="186" fontSize="13" fill={COLORS.foreground} fillOpacity="0.45" textAnchor="middle" fontFamily={FONTS.semibold}>S</SvgText>
      <SvgText x="182" y="105" fontSize="13" fill={COLORS.foreground} fillOpacity="0.45" textAnchor="middle" fontFamily={FONTS.semibold}>E</SvgText>
      <SvgText x="18" y="105" fontSize="13" fill={COLORS.foreground} fillOpacity="0.45" textAnchor="middle" fontFamily={FONTS.semibold}>W</SvgText>
      <SvgText x="157" y="49" fontSize="10" fill={COLORS.foreground} fillOpacity="0.32" textAnchor="middle" fontFamily={FONTS.medium}>NE</SvgText>
      <SvgText x="157" y="158" fontSize="10" fill={COLORS.foreground} fillOpacity="0.32" textAnchor="middle" fontFamily={FONTS.medium}>SE</SvgText>
      <SvgText x="43" y="158" fontSize="10" fill={COLORS.foreground} fillOpacity="0.32" textAnchor="middle" fontFamily={FONTS.medium}>SW</SvgText>
      <SvgText x="43" y="49" fontSize="10" fill={COLORS.foreground} fillOpacity="0.32" textAnchor="middle" fontFamily={FONTS.medium}>NW</SvgText>
    </Svg>
  );
}

/** The two-tone needle, drawn on its own so it can be rotated or animated. */
export function CompassNeedle({ size, angle = 0 }: { size: number; angle?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <G transform={`rotate(${angle} 100 100)`}>
        <Path d="M100 26 L110 104 L100 96 L90 104 Z" fill={COLORS.primary} />
        <Path d="M100 174 L110 96 L100 104 L90 96 Z" fill={COLORS.primary} fillOpacity="0.18" />
      </G>
      <Circle cx="100" cy="100" r="7" fill={COLORS.white} stroke={COLORS.primary} strokeWidth="2.5" />
    </Svg>
  );
}

const AnimatedNeedle = Animated.createAnimatedComponent(View);

interface CompassDialProps {
  value: string;
  onChange: (dir: Direction) => void;
  size?: number;
}

/**
 * Pick a facing direction. The whole face is tappable — a touch anywhere snaps
 * to the nearest of the eight directions — and the chips below give an explicit
 * alternative, since a bare dial gives no hint that it can be tapped.
 */
export default function CompassDial({ value, onChange, size = 248 }: CompassDialProps) {
  const target = ANGLE[value] ?? 0;
  const spin = useRef(new Animated.Value(target)).current;
  // Track the unwrapped angle so 315° -> 0° turns 45° forward, not 315° back.
  const lastAngle = useRef(target);

  useEffect(() => {
    let next = target;
    const delta = ((next - (lastAngle.current % 360)) + 540) % 360 - 180;
    next = lastAngle.current + delta;
    lastAngle.current = next;

    const animation = Animated.timing(spin, {
      toValue: next, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [target, spin]);

  const rotate = spin.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  /** Convert a touch inside the dial to the nearest compass point. */
  const pickFromTouch = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    const dx = locationX - size / 2;
    const dy = locationY - size / 2;
    // Ignore taps on the hub, where there is no meaningful direction.
    if (Math.hypot(dx, dy) < size * 0.12) return;

    const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
    const index = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
    onChange(DIRECTIONS[index]);
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={pickFromTouch}
        style={{ width: size, height: size }}
        accessibilityRole="adjustable"
        accessibilityLabel="Compass dial"
        accessibilityValue={{ text: DIRECTION_NAMES[value] ?? 'Not set' }}
        accessibilityHint="Tap a point on the dial to set the entrance direction"
      >
        <CompassHousing size={size} />
        <AnimatedNeedle
          style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}
          pointerEvents="none"
        >
          <CompassNeedle size={size} />
        </AnimatedNeedle>
      </Pressable>

      <View style={styles.chips}>
        {DIRECTIONS.map((dir) => {
          const active = value === dir;
          return (
            <Pressable
              key={dir}
              onPress={() => onChange(dir)}
              style={[styles.chip, active && styles.chipOn]}
              accessibilityRole="button"
              accessibilityLabel={DIRECTION_NAMES[dir]}
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextOn]}>{dir}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  chip: {
    minWidth: 48, height: 44, paddingHorizontal: 12, borderRadius: 999,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.cardBg,
    alignItems: 'center', justifyContent: 'center',
  },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontFamily: FONTS.bold, fontSize: 12, color: 'rgba(45,41,38,0.65)', letterSpacing: 0.4 },
  chipTextOn: { color: COLORS.white },
});
