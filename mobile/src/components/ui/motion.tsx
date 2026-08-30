import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, ViewStyle, StyleProp } from 'react-native';

/**
 * Fades and lifts content into place. Give siblings increasing `delay` values
 * for a staggered entrance. Transform and opacity only, so it runs on the UI
 * thread.
 */
export function FadeSlideIn({
  children, delay = 0, distance = 14, style,
}: {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** A press that dips slightly, so taps feel physical rather than instant. */
export function PressScale({
  children, onPress, onLongPress, style, accessibilityLabel, accessibilityHint,
  accessibilityActions, onAccessibilityAction, to = 0.97,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** Screen-reader equivalents for gestures, e.g. a delete long-press. */
  accessibilityActions?: { name: string; label?: string }[];
  onAccessibilityAction?: (event: { nativeEvent: { actionName: string } }) => void;
  to?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  // Pressable still fires onPress after a long press; swallow that one.
  const longPressed = useRef(false);

  const animate = (toValue: number) => {
    Animated.spring(scale, {
      toValue, useNativeDriver: true, speed: 40, bounciness: 4,
    }).start();
  };

  return (
    <Pressable
      onPress={() => {
        if (longPressed.current) { longPressed.current = false; return; }
        onPress?.();
      }}
      onLongPress={onLongPress ? () => { longPressed.current = true; onLongPress(); } : undefined}
      onPressIn={() => { longPressed.current = false; animate(to); }}
      onPressOut={() => animate(1)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityActions={accessibilityActions}
      onAccessibilityAction={onAccessibilityAction}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

/** A slow rise-and-fall, used to keep the empty-state compass feeling alive. */
export function Float({ children, distance = 6 }: { children: React.ReactNode; distance?: number }) {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift]);

  return (
    <Animated.View
      style={{
        transform: [{ translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}
