import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { COLORS } from '@/constants/colors';

export default function AnalyzeAnother() {
  const { t } = useTranslation();

  const handlePress = () => {
    router.replace('/');
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <Text style={styles.text}>{t('analyze_another')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  text: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
