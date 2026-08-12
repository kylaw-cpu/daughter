/**
 * Vendor offline redemption queue (spec §11): confirmations made while
 * offline are stored locally, shown with a visible pending indicator, and
 * synced automatically when connectivity returns. The server (mock) is the
 * source of truth — a code redeemed elsewhere first becomes a `conflict`
 * entry with a clear resolution message, never a silent failure.
 *
 * Backed by AsyncStorage rather than expo-sqlite: the queue is tiny
 * (a few pending records), so a JSON list is simpler and equally durable.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { api, ApiError } from '@/lib/api';
import { KEYS } from '@/lib/storage';
import { PendingRedemption } from '@/models/types';
import { useNetworkStore } from '@/hooks/useOnline';

interface VendorQueueState {
  items: PendingRedemption[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  enqueue: (item: Omit<PendingRedemption, 'status' | 'queuedAt' | 'id'>) => Promise<void>;
  sync: () => Promise<void>;
  clearResolved: () => Promise<void>;
}

async function persist(items: PendingRedemption[]) {
  try {
    await AsyncStorage.setItem(KEYS.vendorQueue, JSON.stringify(items));
  } catch {
    // best-effort; in-memory queue remains authoritative for the session
  }
}

let syncing = false;

export const useVendorQueue = create<VendorQueueState>((set, get) => ({
  items: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEYS.vendorQueue);
      set({ items: raw ? (JSON.parse(raw) as PendingRedemption[]) : [], hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  enqueue: async (item) => {
    const record: PendingRedemption = {
      ...item,
      id: `q_${Math.random().toString(36).slice(2, 10)}`,
      queuedAt: new Date().toISOString(),
      status: 'pending',
    };
    const items = [record, ...get().items];
    set({ items });
    await persist(items);
  },

  sync: async () => {
    if (syncing) return;
    syncing = true;
    try {
      const pending = get().items.filter((i) => i.status === 'pending');
      for (const item of pending) {
        try {
          await api.redeemConfirm({
            orderId: item.orderId,
            photoUri: item.photoUri,
            note: item.note,
            idemKey: item.id,
          });
          markItem(set, get, item.id, 'synced');
        } catch (error) {
          if (error instanceof ApiError && error.code === 'ALREADY_REDEEMED') {
            markItem(set, get, item.id, 'conflict');
          }
          // Other errors (still offline, timeouts): stay pending, retry later.
        }
      }
      await persist(get().items);
    } finally {
      syncing = false;
    }
  },

  clearResolved: async () => {
    const items = get().items.filter((i) => i.status === 'pending');
    set({ items });
    await persist(items);
  },
}));

function markItem(
  set: (fn: (s: VendorQueueState) => Partial<VendorQueueState>) => void,
  get: () => VendorQueueState,
  itemId: string,
  status: PendingRedemption['status']
) {
  set((s) => ({
    items: s.items.map((i) => (i.id === itemId ? { ...i, status } : i)),
  }));
}

// Auto-sync whenever connectivity returns.
useNetworkStore.subscribe((state, prev) => {
  if (state.online && !prev.online) {
    useVendorQueue.getState().sync();
  }
});
