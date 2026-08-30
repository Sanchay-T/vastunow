import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { COLORS } from '@/constants/colors';

interface LoadingSpinnerProps {
  step?: number;
  message?: string;
}

export default function LoadingSpinner({ step = 1, message }: LoadingSpinnerProps) {
  const messages = [
    'Analyzing your floor plan...',
    'Generating your personalized report...',
  ];

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.text}>{message || messages[step - 1] || 'Loading...'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
