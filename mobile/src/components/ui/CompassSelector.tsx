import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { COLORS } from '@/constants/colors';
import { DIRECTION_LABELS } from '@/lib/types/vastu';

const ALL_DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

const DIRECTION_ICONS: Record<string, string> = {
  N: '↑',
  NE: '↗',
  E: '→',
  SE: '↘',
  S: '↓',
  SW: '↙',
  W: '←',
  NW: '↖',
};

interface CompassSelectorProps {
  value: string;
  onChange: (dir: string) => void;
}

export default function CompassSelector({ value, onChange }: CompassSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Facing Direction</Text>
      <Text style={styles.helper}>Tap the direction your main entrance faces</Text>

      <View style={styles.compassGrid}>
        {ALL_DIRECTIONS.map((dir) => {
          const isSelected = value === dir;
          return (
            <TouchableOpacity
              key={dir}
              onPress={() => onChange(dir)}
              style={[
                styles.directionBtn,
                isSelected && styles.directionBtnSelected,
              ]}
            >
              <Text style={[
                styles.directionIcon,
                isSelected && styles.directionIconSelected,
              ]}>
                {DIRECTION_ICONS[dir]}
              </Text>
              <Text style={[
                styles.directionLabel,
                isSelected && styles.directionLabelSelected,
              ]}>
                {dir}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {value ? (
        <View style={styles.selectedContainer}>
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedText}>
              Selected: {DIRECTION_LABELS[value] || value}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.foreground,
    textAlign: 'center',
  },
  helper: {
    fontSize: 12,
    color: COLORS.gray500,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  compassGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  directionBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
    gap: 2,
  },
  directionBtnSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    transform: [{ scale: 1.1 }],
  },
  directionIcon: {
    fontSize: 22,
    color: COLORS.gray500,
  },
  directionIconSelected: {
    color: COLORS.white,
  },
  directionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.gray500,
  },
  directionLabelSelected: {
    color: COLORS.white,
  },
  selectedContainer: {
    marginTop: 8,
  },
  selectedBadge: {
    backgroundColor: 'rgba(110, 17, 38, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(110, 17, 38, 0.15)',
  },
  selectedText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
});
