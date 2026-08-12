/**
 * i18n bootstrap (spec §4). All user-facing strings live in locale files —
 * nothing is hardcoded in screens. Language choice persists immediately and
 * re-renders the whole app; RTL is enabled for RTL languages.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import ar from './locales/ar.json';
import en from './locales/en.json';

export const LANGUAGE_STORAGE_KEY = 'sendplate.language';

export interface AppLanguage {
  code: string;
  /** Shown in its own script on the welcome screen. */
  nativeName: string;
  rtl: boolean;
}

export const SUPPORTED_LANGUAGES: AppLanguage[] = [
  { code: 'en', nativeName: 'English', rtl: false },
  { code: 'ar', nativeName: 'العربية', rtl: true },
];

export function initI18n(initialLanguage?: string) {
  const deviceLanguage = getLocales()[0]?.languageCode ?? 'en';
  const supported = SUPPORTED_LANGUAGES.map((l) => l.code);
  const lng =
    initialLanguage && supported.includes(initialLanguage)
      ? initialLanguage
      : supported.includes(deviceLanguage)
        ? deviceLanguage
        : 'en';

  if (!i18n.isInitialized) {
    // eslint-disable-next-line import/no-named-as-default-member
    i18n.use(initReactI18next).init({
      resources: { en: { translation: en }, ar: { translation: ar } },
      lng,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      returnNull: false,
    });
  }
  syncRtl(lng);
  return i18n;
}

function syncRtl(languageCode: string) {
  const rtl = SUPPORTED_LANGUAGES.find((l) => l.code === languageCode)?.rtl ?? false;
  I18nManager.allowRTL(rtl);
  // Note: on native, a flip of forceRTL takes full effect after the next app
  // reload; components should still use start/end styles so most of the UI
  // mirrors immediately.
  if (I18nManager.isRTL !== rtl) {
    I18nManager.forceRTL(rtl);
  }
}

export async function changeLanguage(code: string) {
  await i18n.changeLanguage(code);
  syncRtl(code);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
}

export async function loadPersistedLanguage(): Promise<string | undefined> {
  try {
    return (await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)) ?? undefined;
  } catch {
    return undefined;
  }
}

export default i18n;
