import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@/constants/colors';

export default function NavBar() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.brandContainer}>
        <Text style={styles.title}>{t('app_name')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  brandContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
