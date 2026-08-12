import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Order, Vendor } from '@/api/types';

/**
 * Offline cache for the recipient's "show my code" case (spec §3, §11):
 * active claim codes and the vendor list are cached on every successful fetch
 * and served with zero connectivity. Money/proof data is never mutated here —
 * this is a read replica only.
 */

const ORDERS_KEY = 'sendplate.cache.recipientOrders.v1';
const VENDORS_KEY = 'sendplate.cache.vendors.v1';

export async function cacheRecipientOrders(orders: Order[]): Promise<void> {
  try {
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // Cache write failure only degrades offline UX.
  }
}

export async function readCachedRecipientOrders(): Promise<Order[] | null> {
  try {
    const raw = await AsyncStorage.getItem(ORDERS_KEY);
    return raw ? (JSON.parse(raw) as Order[]) : null;
  } catch {
    return null;
  }
}

export async function cacheVendors(vendors: Vendor[]): Promise<void> {
  try {
    await AsyncStorage.setItem(VENDORS_KEY, JSON.stringify(vendors));
  } catch {
    // Non-fatal.
  }
}

export async function readCachedVendors(): Promise<Vendor[] | null> {
  try {
    const raw = await AsyncStorage.getItem(VENDORS_KEY);
    return raw ? (JSON.parse(raw) as Vendor[]) : null;
  } catch {
    return null;
  }
}
