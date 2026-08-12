import { create } from 'zustand';
import type { Order, PackageItem, PackageTemplate, Recipient } from '@/api/types';

/**
 * Draft state for the sender's send flow (choose recipient → package →
 * customize → review → pay). Kept out of navigation params so a failed
 * payment never loses the order (spec §6.2 Pay states).
 */
interface SendFlowState {
  recipient: Recipient | null;
  template: PackageTemplate | null;
  /** item key -> quantity (base items + chosen add-ons). */
  quantities: Record<string, number>;
  message: string;
  /** Order created server-side at review time; reused on payment retry. */
  draftOrder: Order | null;

  start(recipient: Recipient): void;
  chooseTemplate(template: PackageTemplate): void;
  setQuantity(key: string, quantity: number): void;
  setMessage(message: string): void;
  setDraftOrder(order: Order | null): void;
  selectedItems(): PackageItem[];
  reset(): void;
}

export const useSendFlow = create<SendFlowState>((set, get) => ({
  recipient: null,
  template: null,
  quantities: {},
  message: '',
  draftOrder: null,

  start(recipient) {
    set({ recipient, template: null, quantities: {}, message: '', draftOrder: null });
  },

  chooseTemplate(template) {
    const quantities: Record<string, number> = {};
    for (const it of template.baseItems) quantities[it.key] = it.quantity;
    set({ template, quantities, draftOrder: null });
  },

  setQuantity(key, quantity) {
    set({
      quantities: { ...get().quantities, [key]: Math.max(0, quantity) },
      draftOrder: null, // price changed; a stale draft must not be paid
    });
  },

  setMessage(message) {
    set({ message });
  },

  setDraftOrder(order) {
    set({ draftOrder: order });
  },

  selectedItems() {
    const { template, quantities } = get();
    if (!template) return [];
    const all = [...template.baseItems, ...template.addOns];
    return all
      .filter((it) => (quantities[it.key] ?? 0) > 0)
      .map((it) => ({ ...it, quantity: quantities[it.key] ?? 0 }));
  },

  reset() {
    set({ recipient: null, template: null, quantities: {}, message: '', draftOrder: null });
  },
}));
