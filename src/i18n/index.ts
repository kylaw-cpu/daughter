import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { en } from './locales/en';
import { ar } from './locales/ar';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', rtl: false },
  { code: 'ar', label: 'العربية', rtl: true },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

const LANGUAGE_KEY = 'sendplate.language';

function deviceLanguage(): LanguageCode {
  const device = getLocales()[0]?.languageCode ?? 'en';
  return SUPPORTED_LANGUAGES.some((l) => l.code === device)
    ? (device as LanguageCode)
    : 'en';
}

export function initI18n(initialLanguage?: string) {
  if (i18n.isInitialized) return i18n;
  i18n.use(initReactI18next).init({
    resources: { en, ar },
    lng: initialLanguage ?? deviceLanguage(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  return i18n;
}

export async function loadSavedLanguage(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LANGUAGE_KEY);
  } catch {
    return null;
  }
}

export function isRTL(code: string): boolean {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.rtl ?? false;
}

/**
 * Changes language immediately (persisted for next launch). RN needs a reload
 * for a full LTR<->RTL flip; we set the flag so the next start is laid out
 * correctly, while text itself switches instantly.
 */
export async function setLanguage(code: LanguageCode) {
  await i18n.changeLanguage(code);
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, code);
  } catch {
    // Non-fatal: language still applies for this session.
  }
  const rtl = isRTL(code);
  if (I18nManager.isRTL !== rtl) {
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
  }
}

export default i18n;
