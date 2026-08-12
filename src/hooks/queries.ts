import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '@/api';
import type { Order, PackageItem, Recipient } from '@/api/types';

/** Server-state hooks. Components never call `api` directly. */

export const keys = {
  recipients: ['recipients'] as const,
  packages: (recipientId: string, lang: string) => ['packages', recipientId, lang] as const,
  orders: (role: 'sender' | 'recipient') => ['orders', role] as const,
  order: (id: string) => ['order', id] as const,
  vendors: ['vendors'] as const,
  nudges: (lang: string) => ['nudges', lang] as const,
};

export function useRecipients() {
  return useQuery({ queryKey: keys.recipients, queryFn: () => api.listRecipients() });
}

export function useCreateRecipient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Recipient, 'id' | 'senderId'>) => api.createRecipient(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.recipients }),
  });
}

export function usePackages(recipientId: string | undefined) {
  const { i18n } = useTranslation();
  return useQuery({
    queryKey: keys.packages(recipientId ?? 'none', i18n.language),
    queryFn: () => api.listPackages(recipientId ?? ''),
    enabled: recipientId != null,
  });
}

export function useOrders(role: 'sender' | 'recipient', refetchIntervalMs?: number) {
  return useQuery({
    queryKey: keys.orders(role),
    queryFn: () => api.listOrders(role),
    // Polling on focus/interval is the v1 realtime strategy (spec §10).
    refetchInterval: refetchIntervalMs,
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: keys.order(id ?? 'none'),
    queryFn: () => api.getOrder(id ?? ''),
    enabled: id != null,
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: (input: {
      recipientId: string;
      templateId: string;
      items: PackageItem[];
      message?: Order['message'];
    }) => api.createOrder(input),
  });
}

export function usePayOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      paymentMethodId,
      idemKey,
    }: {
      orderId: string;
      paymentMethodId: string;
      idemKey: string;
    }) => api.payOrder(orderId, paymentMethodId, idemKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.orders('sender') });
      qc.invalidateQueries({ queryKey: keys.orders('recipient') });
    },
  });
}

export function useVendors() {
  return useQuery({ queryKey: keys.vendors, queryFn: () => api.listVendors() });
}

export function useNudges() {
  const { i18n } = useTranslation();
  return useQuery({ queryKey: keys.nudges(i18n.language), queryFn: () => api.listNudges() });
}
