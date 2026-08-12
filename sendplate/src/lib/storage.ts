/**
 * Small storage helpers.
 * - SecureStore: tokens + PIN hash (spec §13).
 * - AsyncStorage: offline caches (active codes, vendors, orders) so
 *   recipient screens work with zero connectivity (spec §3/§11).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

export const KEYS = {
  token: 'sendplate.token',
  pinHash: 'sendplate.pinHash',
  authSnapshot: 'sendplate.auth',
  cachePrefix: 'sendplate.cache.',
  vendorQueue: 'sendplate.vendorQueue',
} as const;

const PIN_SALT = 'sendplate-pin-v1'; // static salt + device-local storage only

export async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${PIN_SALT}:${pin}`);
}

export async function saveSecure(key: string, value: string) {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // SecureStore unavailable (e.g. web preview) — degrade to AsyncStorage.
    await AsyncStorage.setItem(key, value);
  }
}

export async function readSecure(key: string): Promise<string | null> {
  try {
    const v = await SecureStore.getItemAsync(key);
    if (v !== null) return v;
  } catch {
    // fall through
  }
  return AsyncStorage.getItem(key);
}

export async function deleteSecure(key: string) {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
  await AsyncStorage.removeItem(key);
}

export async function writeCache<T>(key: string, value: T) {
  try {
    await AsyncStorage.setItem(KEYS.cachePrefix + key, JSON.stringify(value));
  } catch {
    // Cache writes are best-effort.
  }
}

export async function readCache<T>(key: string): Promise<T | undefined> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.cachePrefix + key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Offline-first fetch: try the network fn and refresh the cache; if it
 * fails (offline, timeout), serve the last known value instead of an
 * error. Screens using this never dead-end without data they've seen
 * before.
 */
export async function cachedFetch<T>(key: string, fn: () => Promise<T>): Promise<T> {
  try {
    const fresh = await fn();
    await writeCache(key, fresh);
    return fresh;
  } catch (error) {
    const cached = await readCache<T>(key);
    if (cached !== undefined) return cached;
    throw error;
  }
}
