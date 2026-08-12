import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { Role, User } from '@/api/types';

/**
 * Lightweight local/UI state (zustand). Server state lives in react-query.
 * Token + PIN hash go to SecureStore; the cached user goes to AsyncStorage so
 * the recipient home works offline.
 */

const USER_CACHE_KEY = 'sendplate.user';
const PIN_KEY = 'sendplate.pinHash';
const TOKEN_KEY = 'sendplate.token';

/**
 * PIN is stored only as a salted hash (spec §13). FNV-1a keeps the mock
 * dependency-free; the real backend swaps in a proper KDF (argon2/scrypt)
 * server-side in Phase 4.
 */
export function hashPin(pin: string, salt = 'sendplate-v1'): string {
  const input = `${salt}:${pin}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

interface AuthState {
  hydrated: boolean;
  user: User | null;
  /** Role picked on the welcome screen, before an account exists. */
  intendedRole: Role | null;
  /** Phone captured during onboarding. */
  pendingPhone: string | null;
  otpRequestId: string | null;
  hasPin: boolean;

  hydrate(): Promise<void>;
  setIntendedRole(role: Role): void;
  setPendingPhone(phone: string, requestId: string): void;
  setUser(user: User | null): Promise<void>;
  savePin(pin: string): Promise<void>;
  verifyPin(pin: string): Promise<boolean>;
  saveToken(token: string): Promise<void>;
  signOut(): Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  hydrated: false,
  user: null,
  intendedRole: null,
  pendingPhone: null,
  otpRequestId: null,
  hasPin: false,

  async hydrate() {
    if (get().hydrated) return;
    let user: User | null = null;
    let hasPin = false;
    try {
      const raw = await AsyncStorage.getItem(USER_CACHE_KEY);
      user = raw ? (JSON.parse(raw) as User) : null;
      hasPin = (await SecureStore.getItemAsync(PIN_KEY)) != null;
    } catch {
      // Fall through to signed-out state; never block launch on storage.
    }
    set({ user, hasPin, hydrated: true });
  },

  setIntendedRole(role) {
    set({ intendedRole: role });
  },

  setPendingPhone(phone, requestId) {
    set({ pendingPhone: phone, otpRequestId: requestId });
  },

  async setUser(user) {
    set({ user });
    try {
      if (user) await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
      else await AsyncStorage.removeItem(USER_CACHE_KEY);
    } catch {
      // Cache miss only affects offline cold start.
    }
  },

  async savePin(pin) {
    await SecureStore.setItemAsync(PIN_KEY, hashPin(pin));
    set({ hasPin: true });
  },

  async verifyPin(pin) {
    const stored = await SecureStore.getItemAsync(PIN_KEY);
    return stored != null && stored === hashPin(pin);
  },

  async saveToken(token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async signOut() {
    try {
      await SecureStore.deleteItemAsync(PIN_KEY);
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_CACHE_KEY);
    } catch {
      // Best-effort cleanup.
    }
    set({ user: null, intendedRole: null, pendingPhone: null, otpRequestId: null, hasPin: false });
  },
}));
