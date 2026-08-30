import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Image, Animated, Easing } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS } from '@/constants/colors';

const MASCOT = require('../../../assets/images/mascot.png');

/**
 * The brand mascot inside a gold-ringed medallion. Deliberately not a compass —
 * the dial belongs to the direction step, and repeating it here made every
 * screen look the same.
 */
export default function Medallion({ size = 148 }: { size?: number }) {
  const enter = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rise = Animated.timing(enter, {
      toValue: 1, duration: 520, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true,
    });
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 2800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 2800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    rise.start();
    float.start();
    return () => { rise.stop(); float.stop(); };
  }, [enter, drift]);

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        opacity: enter,
        transform: [
          { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) },
          { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) },
        ],
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Defs>
          <LinearGradient id="halo" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#ffffff" />
            <Stop offset="1" stopColor="#F7F3EA" />
          </LinearGradient>
        </Defs>
        <Circle cx="100" cy="100" r="97" fill="url(#halo)" stroke={COLORS.gold} strokeOpacity="0.55" strokeWidth="1.5" />
        <Circle cx="100" cy="100" r="86" fill="none" stroke={COLORS.gold} strokeOpacity="0.22" strokeWidth="0.8" />
        <Circle cx="100" cy="100" r="74" fill="none" stroke={COLORS.primary} strokeOpacity="0.07" strokeWidth="0.8" />
      </Svg>

      <View style={styles.imageWrap} pointerEvents="none">
        <Image source={MASCOT} style={styles.image} resizeMode="contain" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  imageWrap: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', padding: '18%',
  },
  image: { width: '100%', height: '100%' },
});
