import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * SecureStore on native; AsyncStorage fallback on web, where expo-secure-store
 * is unavailable. Web is a demo/preview surface only — production secrets live
 * on device keystores (spec §13).
 */
const isWeb = Platform.OS === 'web';

export async function secureGet(key: string): Promise<string | null> {
  try {
    return isWeb ? await AsyncStorage.getItem(key) : await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function secureSet(key: string, value: string): Promise<void> {
  if (isWeb) await AsyncStorage.setItem(key, value);
  else await SecureStore.setItemAsync(key, value);
}

export async function secureDelete(key: string): Promise<void> {
  try {
    if (isWeb) await AsyncStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  } catch {
    // Best-effort cleanup.
  }
}
