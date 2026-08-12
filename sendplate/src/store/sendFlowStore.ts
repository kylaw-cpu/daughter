import { create } from 'zustand';
import { Order, PackageItem, PackageTemplate, Recipient } from '@/models/types';

/**
 * Draft state for the 5-step send flow (spec §6.2). Lives outside the
 * screens so a payment failure or an accidental back never loses the
 * order-in-progress.
 */
interface SendFlowState {
  recipient: Recipient | null;
  template: PackageTemplate | null;
  quantity: number;
  selectedAddOnKeys: string[];
  messageText: string;
  /** The created (unpaid) order, kept across payment retries. */
  draftOrder: Order | null;

  setRecipient: (recipient: Recipient) => void;
  setTemplate: (template: PackageTemplate) => void;
  setQuantity: (quantity: number) => void;
  toggleAddOn: (key: string) => void;
  setMessageText: (text: string) => void;
  setDraftOrder: (order: Order | null) => void;
  buildItems: () => PackageItem[];
  totalLocalMinor: () => number;
  reset: () => void;
}

export const useSendFlow = create<SendFlowState>((set, get) => ({
  recipient: null,
  template: null,
  quantity: 1,
  selectedAddOnKeys: [],
  messageText: '',
  draftOrder: null,

  setRecipient: (recipient) => set({ recipient }),
  setTemplate: (template) =>
    set({ template, quantity: 1, selectedAddOnKeys: [], draftOrder: null }),
  setQuantity: (quantity) => set({ quantity: Math.min(5, Math.max(1, quantity)), draftOrder: null }),
  toggleAddOn: (key) =>
    set((s) => ({
      selectedAddOnKeys: s.selectedAddOnKeys.includes(key)
        ? s.selectedAddOnKeys.filter((k) => k !== key)
        : [...s.selectedAddOnKeys, key],
      draftOrder: null,
    })),
  setMessageText: (messageText) => set({ messageText }),
  setDraftOrder: (draftOrder) => set({ draftOrder }),

  buildItems: () => {
    const { template, quantity, selectedAddOnKeys } = get();
    if (!template) return [];
    const base = template.baseItems.map((item) => ({
      ...item,
      quantity: item.quantity * quantity,
    }));
    const addOns = template.addOns.filter((a) => selectedAddOnKeys.includes(a.key));
    return [...base, ...addOns];
  },

  totalLocalMinor: () =>
    get()
      .buildItems()
      .reduce((sum, item) => sum + item.unitPriceLocal * item.quantity, 0),

  reset: () =>
    set({
      recipient: null,
      template: null,
      quantity: 1,
      selectedAddOnKeys: [],
      messageText: '',
      draftOrder: null,
    }),
}));
