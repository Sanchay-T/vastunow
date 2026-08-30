import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, View, ViewStyle } from 'react-native';
import { COLORS } from '@/constants/colors';
import { FONTS } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  size?: 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  /** Rendered to the right of the label, e.g. an arrow. */
  icon?: React.ReactNode;
  /** Rendered to the left of the label, e.g. a download glyph. */
  iconLeft?: React.ReactNode;
  style?: ViewStyle;
}

export default function Button({
  title, onPress, variant = 'primary', size = 'lg',
  disabled, loading, icon, iconLeft, style,
}: ButtonProps) {
  const isOutline = variant === 'outline';
  const inactive = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={inactive}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive }}
      style={[
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        isOutline ? styles.outline : styles.primary,
        inactive && styles.inactive,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isOutline ? COLORS.primary : COLORS.white} />
      ) : (
        <View style={styles.row}>
          {iconLeft}
          <Text style={[styles.label, isOutline && styles.labelOutline]}>{title}</Text>
          {icon}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  md: { height: 48, paddingHorizontal: 20 },
  lg: { height: 52, paddingHorizontal: 24 },
  primary: { backgroundColor: COLORS.primary },
  outline: { borderWidth: 2, borderColor: COLORS.primary, backgroundColor: 'transparent' },
  inactive: { opacity: 0.45 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.white },
  labelOutline: { color: COLORS.primary, fontSize: 14 },
});
