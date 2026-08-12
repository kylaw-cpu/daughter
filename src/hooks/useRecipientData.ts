import { useEffect, useState } from 'react';
import {
  cacheRecipientOrders,
  cacheVendors,
  readCachedRecipientOrders,
  readCachedVendors,
} from '@/lib/codeCache';
import { useOrders, useVendors } from './queries';
import type { Order, Vendor } from '@/api/types';

/**
 * Recipient reads with offline fallback: live data when we have it (and
 * refresh the cache), cached data when the network is gone. The home screen
 * must work with no signal (spec §6.3).
 */
export function useRecipientOrders(pollMs?: number): {
  orders: Order[] | null;
  fromCache: boolean;
  isPending: boolean;
  isError: boolean;
  refetch(): void;
} {
  const query = useOrders('recipient', pollMs);
  const [cached, setCached] = useState<Order[] | null>(null);

  useEffect(() => {
    if (query.data) cacheRecipientOrders(query.data);
  }, [query.data]);

  useEffect(() => {
    if (!query.data) readCachedRecipientOrders().then(setCached);
  }, [query.data]);

  const orders = query.data ?? cached;
  return {
    orders,
    fromCache: !query.data && cached != null,
    isPending: query.isPending && cached == null,
    isError: query.isError && cached == null,
    refetch: () => query.refetch(),
  };
}

export function useVendorsWithCache(): { vendors: Vendor[] | null; isPending: boolean } {
  const query = useVendors();
  const [cached, setCached] = useState<Vendor[] | null>(null);

  useEffect(() => {
    if (query.data) cacheVendors(query.data);
  }, [query.data]);

  useEffect(() => {
    if (!query.data) readCachedVendors().then(setCached);
  }, [query.data]);

  return { vendors: query.data ?? cached, isPending: query.isPending && cached == null };
}
