import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '@/locales/en/common.json';
import hi from '@/locales/hi/common.json';

const LANGUAGE_KEY = 'vastu_language';

async function getSavedLanguage(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved) return saved;
  } catch {
    // ignore
  }
  const locales = Localization.getLocales();
  const deviceLang = locales[0]?.languageCode || 'en';
  return deviceLang === 'hi' ? 'hi' : 'en';
}

async function initI18n() {
  const lang = await getSavedLanguage();

  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        hi: { translation: hi },
      },
      lng: lang,
      fallbackLng: 'en',
      supportedLngs: ['en', 'hi'],
      interpolation: {
        escapeValue: false,
      },
    });

  i18n.on('languageChanged', async (lng) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lng);
    } catch {
      // ignore
    }
  });

  return i18n;
}

export default i18n;

export { initI18n };
