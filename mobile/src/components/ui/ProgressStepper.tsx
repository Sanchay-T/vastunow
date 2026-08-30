import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Check } from './icons';
import { COLORS } from '@/constants/colors';
import { FONTS } from '@/constants/theme';

const STEPS = ['Upload', 'Review', 'Report'];

export default function ProgressStepper({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        {STEPS.map((label, i) => {
          const step = i + 1;
          const done = step < currentStep;
          const active = step === currentStep;

          return (
            <React.Fragment key={label}>
              <View style={styles.step}>
                <View style={[styles.circle, (done || active) && styles.circleOn, active && styles.circleActive]}>
                  {done ? (
                    <Check size={15} color={COLORS.white} strokeWidth={3} />
                  ) : (
                    <Text style={[styles.num, active && styles.numOn]}>{step}</Text>
                  )}
                </View>
                <Text style={[styles.label, !done && !active && styles.labelPending]}>{label}</Text>
              </View>

              {i < STEPS.length - 1 && (
                <View style={[styles.connector, step < currentStep && styles.connectorOn]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  track: { flexDirection: 'row', alignItems: 'flex-start', width: 260 },
  step: { width: 60, alignItems: 'center', gap: 6 },
  circle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center',
  },
  circleOn: { backgroundColor: COLORS.primary },
  circleActive: {
    borderWidth: 4, borderColor: 'rgba(110,17,38,0.2)',
    width: 40, height: 40, borderRadius: 20,
  },
  num: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.gray500 },
  numOn: { color: COLORS.white },
  label: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.secondary },
  labelPending: { color: COLORS.gray400 },
  connector: {
    flex: 1, height: 2, borderRadius: 1, backgroundColor: '#e5e7eb',
    marginTop: 15, marginHorizontal: 6,
  },
  connectorOn: { backgroundColor: COLORS.primary },
});
