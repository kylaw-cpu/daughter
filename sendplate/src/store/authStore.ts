import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { Role, User } from '@/models/types';
import { deleteSecure, hashPin, KEYS, readSecure, saveSecure } from '@/lib/storage';

interface AuthState {
  /** undefined = still hydrating from storage (splash gate). */
  hydrated: boolean;
  user: User | null;
  token: string | null;
  hasPin: boolean;
  /** Session-only: PIN entered since this launch (spec §6.1 "open the app"). */
  unlocked: boolean;
  setUnlocked: (unlocked: boolean) => void;
  /** Chosen on the welcome screen, consumed by the auth flow. */
  intendedRole: Role;
  pendingPhone: string;
  otpRequestId: string | null;

  hydrate: () => Promise<void>;
  setIntendedRole: (role: Role) => void;
  setPendingPhone: (phone: string) => void;
  setOtpRequestId: (id: string | null) => void;
  signIn: (user: User, token: string) => Promise<void>;
  setUser: (user: User) => void;
  setPin: (pin: string) => Promise<string>;
  verifyPin: (pin: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  hydrated: false,
  user: null,
  token: null,
  hasPin: false,
  unlocked: false,
  setUnlocked: (unlocked) => set({ unlocked }),
  intendedRole: 'sender',
  pendingPhone: '',
  otpRequestId: null,

  hydrate: async () => {
    try {
      const [snapshot, token, pinHash] = await Promise.all([
        AsyncStorage.getItem(KEYS.authSnapshot),
        readSecure(KEYS.token),
        readSecure(KEYS.pinHash),
      ]);
      set({
        user: snapshot ? (JSON.parse(snapshot) as User) : null,
        token,
        hasPin: !!pinHash,
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  setIntendedRole: (role) => set({ intendedRole: role }),
  setPendingPhone: (phone) => set({ pendingPhone: phone }),
  setOtpRequestId: (otpRequestId) => set({ otpRequestId }),

  signIn: async (user, token) => {
    set({ user, token });
    await Promise.all([
      AsyncStorage.setItem(KEYS.authSnapshot, JSON.stringify(user)),
      saveSecure(KEYS.token, token),
    ]);
  },

  setUser: (user) => {
    set({ user });
    AsyncStorage.setItem(KEYS.authSnapshot, JSON.stringify(user)).catch(() => {});
  },

  setPin: async (pin) => {
    const digest = await hashPin(pin);
    await saveSecure(KEYS.pinHash, digest);
    set({ hasPin: true, unlocked: true });
    return digest;
  },

  verifyPin: async (pin) => {
    const stored = await readSecure(KEYS.pinHash);
    if (!stored) return false;
    return (await hashPin(pin)) === stored;
  },

  signOut: async () => {
    set({
      user: null,
      token: null,
      hasPin: false,
      unlocked: false,
      otpRequestId: null,
      pendingPhone: '',
    });
    await Promise.all([
      AsyncStorage.removeItem(KEYS.authSnapshot),
      deleteSecure(KEYS.token),
      deleteSecure(KEYS.pinHash),
    ]);
  },
}));
