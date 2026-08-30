import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n/config';

export default function LanguageSwitcher() {
  const { t } = useTranslation();
  const [currentLang, setCurrentLang] = React.useState(i18n.language);

  React.useEffect(() => {
    const handler = (lng: string) => setCurrentLang(lng);
    i18n.on('languageChanged', handler);
    return () => { i18n.off('languageChanged', handler); };
  }, []);

  const toggleLanguage = () => {
    const newLang = currentLang === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <TouchableOpacity onPress={toggleLanguage} style={styles.container}>
      <Text style={[styles.text, currentLang === 'en' && styles.active]}>EN</Text>
      <Text style={styles.divider}>|</Text>
      <Text style={[styles.text, currentLang === 'hi' && styles.active]}>हिं</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 6,
  },
  active: {
    color: '#EA9C33',
  },
  divider: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
  },
});
