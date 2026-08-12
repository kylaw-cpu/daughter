import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { api } from '@/api';
import type { QueuedRedemption } from '@/api/types';

/**
 * Vendor offline redemption queue (spec §11). Confirmations made offline are
 * stored locally and synced when connectivity returns; the server is the
 * source of truth on conflicts (already-redeemed elsewhere fails closed and is
 * dropped from the queue with the conflict surfaced in history).
 *
 * AsyncStorage is sufficient at this queue size; swap to expo-sqlite if the
 * queue ever needs querying beyond "replay everything".
 */

const QUEUE_KEY = 'sendplate.vendorQueue.v1';

interface QueueState {
  items: QueuedRedemption[];
  hydrated: boolean;
  hydrate(): Promise<void>;
  enqueue(item: Omit<QueuedRedemption, 'synced' | 'queuedAt'>): Promise<void>;
  /** Replays queued confirmations; returns how many synced. */
  sync(): Promise<number>;
}

async function persist(items: QueuedRedemption[]) {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch {
    // Queue stays in memory; better than losing the redemption outright.
  }
}

export const useOfflineQueue = create<QueueState>((set, get) => ({
  items: [],
  hydrated: false,

  async hydrate() {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      set({ items: raw ? (JSON.parse(raw) as QueuedRedemption[]) : [], hydrated: true });
    } catch {
      set({ items: [], hydrated: true });
    }
  },

  async enqueue(item) {
    const next: QueuedRedemption = { ...item, queuedAt: new Date().toISOString(), synced: false };
    const items = [...get().items, next];
    set({ items });
    await persist(items);
  },

  async sync() {
    let synced = 0;
    const results = new Map<string, boolean>();
    for (const item of get().items.filter((i) => !i.synced)) {
      try {
        await api.redeemConfirm({
          orderId: item.orderId,
          photoUri: item.photoUri,
          note: item.note,
          idemKey: `queue-${item.orderId}-${item.queuedAt}`,
        });
        results.set(item.orderId + item.queuedAt, true);
        synced += 1;
      } catch (e) {
        // Conflict (already redeemed elsewhere / invalid): server wins — mark
        // it settled so the queue can't wedge. Network errors keep it pending.
        const conflict = e instanceof Error && 'code' in e && (e as { code: string }).code !== 'network';
        results.set(item.orderId + item.queuedAt, conflict);
      }
    }
    if (results.size > 0) {
      const items = get().items.map((i) =>
        results.get(i.orderId + i.queuedAt) ? { ...i, synced: true } : i
      );
      set({ items });
      await persist(items);
    }
    return synced;
  },
}));

export function usePendingSyncCount(): number {
  return useOfflineQueue((s) => s.items.filter((i) => !i.synced).length);
}
