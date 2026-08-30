import React, { useState } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

interface DashedBoxProps {
  children: React.ReactNode;
  radius?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * A dashed, rounded outline drawn with SVG. React Native's
 * `borderStyle: 'dashed'` ignores `borderRadius` on Android, so the dashes come
 * out as a square box; drawing the rect ourselves keeps the corners.
 */
export default function DashedBox({
  children,
  radius = 12,
  color = 'rgba(110,17,38,0.3)',
  style,
}: DashedBoxProps) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  return (
    <View
      style={style}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
      }}
    >
      {size.w > 0 && size.h > 0 && (
        <Svg style={StyleSheet.absoluteFill} width={size.w} height={size.h} pointerEvents="none">
          <Rect
            x={0.75} y={0.75}
            width={Math.max(size.w - 1.5, 0)} height={Math.max(size.h - 1.5, 0)}
            rx={radius} ry={radius}
            fill="none" stroke={color} strokeWidth={1.5} strokeDasharray="6 5"
          />
        </Svg>
      )}
      {children}
    </View>
  );
}
