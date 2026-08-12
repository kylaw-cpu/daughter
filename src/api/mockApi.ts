import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Api } from './contract';
import {
  ApiError,
  HealthNudge,
  Order,
  PackageItem,
  PackageTemplate,
  Recipient,
  User,
  Vendor,
} from './types';
import { priceItems, toSenderAmount } from '@/lib/pricing';
import {
  FX_RATE,
  LOCAL_CURRENCY,
  PROOF_PHOTO_PLACEHOLDER,
  MOCK_VENDORS,
  SENDER_CURRENCY,
  buildMockNudges,
  buildPackageTemplates,
  eligibleVendorsFor,
} from './mockData';

/**
 * In-app fake backend (spec §10 "Mock layer") backed by AsyncStorage, so the
 * entire app is demoable before the backend exists. Swapped for the HTTP
 * client via USE_MOCK_API.
 *
 * Status progression is computed lazily on read instead of with timers, so it
 * survives app restarts:
 *   paid --(~8s)--> ready --(~90s, demo auto-collect)--> collected
 * The 90s window intentionally leaves time to demo the vendor redeem flow by
 * hand before the simulator "collects" it for you.
 */

const DB_KEY = 'sendplate.mockdb.v1';
const READY_DELAY_MS = 8_000;
const AUTO_COLLECT_DELAY_MS = 90_000;
const EXPIRY_DAYS = 7;

interface MockDb {
  user: User | null;
  recipients: Recipient[];
  orders: Order[];
  paidAt: Record<string, string>; // orderId -> ISO time payment landed
  idempotency: Record<string, string>; // idemKey -> orderId already applied
}

const emptyDb: MockDb = { user: null, recipients: [], orders: [], paidAt: {}, idempotency: {} };

let db: MockDb | null = null;

async function loadDb(): Promise<MockDb> {
  if (db) return db;
  try {
    const raw = await AsyncStorage.getItem(DB_KEY);
    db = raw ? { ...emptyDb, ...(JSON.parse(raw) as MockDb) } : { ...emptyDb };
  } catch {
    db = { ...emptyDb };
  }
  return db;
}

async function saveDb(): Promise<void> {
  if (!db) return;
  try {
    await AsyncStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    // Cache write failure is non-fatal for the mock.
  }
}

function delay(ms = 350): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

let idCounter = 0;
function id(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}`;
}

function makeClaimCode(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `PLTE-${digits}`;
}

function templateById(templateId: string): PackageTemplate | undefined {
  return buildPackageTemplates().find((t) => t.id === templateId);
}

/** Lazy status progression + expiry, persisted when anything changes. */
async function progressOrders(d: MockDb): Promise<void> {
  const now = Date.now();
  let changed = false;
  for (const order of d.orders) {
    const paidAt = d.paidAt[order.id] ? new Date(d.paidAt[order.id]!).getTime() : null;
    if (order.status === 'paid' && paidAt && now - paidAt > READY_DELAY_MS) {
      order.status = 'ready';
      changed = true;
    }
    if (order.status === 'ready' && paidAt && now - paidAt > AUTO_COLLECT_DELAY_MS) {
      const vendor = MOCK_VENDORS.find((v) => order.eligibleVendorIds.includes(v.id));
      order.status = 'collected';
      order.proof = {
        vendorId: vendor?.id ?? 'ven_wing_kee',
        collectedAt: new Date().toISOString(),
        photoUrl: PROOF_PHOTO_PLACEHOLDER,
        note: '已交收所有物品 · All items handed over',
        location: vendor?.location,
        itemsDelivered: order.items,
      };
      changed = true;
    }
    if (
      (order.status === 'ready' || order.status === 'paid') &&
      new Date(order.expiresAt).getTime() < now
    ) {
      order.status = 'expired';
      changed = true;
    }
  }
  if (changed) await saveDb();
}

function priceOrder(items: PackageItem[], template: PackageTemplate) {
  const amountLocal = priceItems(items, template);
  const { amountSender, serviceFee } = toSenderAmount(amountLocal, FX_RATE);
  return { amountLocal, amountSender, serviceFee };
}

/**
 * If someone opens the app as a recipient before any sender exists on this
 * device, seed one "ready" credit so the recipient flow is demoable alone.
 */
async function seedRecipientDemo(d: MockDb): Promise<void> {
  if (d.orders.length > 0) return;
  const templates = buildPackageTemplates();
  const template = templates.find((t) => t.key === 'elderly_care') ?? templates[0]!;
  const items = template.baseItems;
  const { amountLocal, amountSender, serviceFee } = priceOrder(items, template);
  const recipient: Recipient = {
    id: id('rcp'),
    senderId: 'usr_demo_sender',
    name: d.user?.name ?? 'Mama',
    phone: '+85291234567',
    relationship: 'daughter',
    town: 'Sham Shui Po 深水埗',
    language: d.user?.language ?? 'en',
  };
  d.recipients.push(recipient);
  const order: Order = {
    id: id('ord'),
    senderId: 'usr_demo_sender',
    recipientId: recipient.id,
    templateId: template.id,
    items,
    message: { type: 'text', content: 'Thinking of you, Mama 💛' },
    amountSenderCurrency: amountSender + serviceFee,
    amountLocalCurrency: amountLocal,
    fxRate: FX_RATE,
    serviceFee,
    status: 'ready',
    claimCode: makeClaimCode(),
    eligibleVendorIds: eligibleVendorsFor(template.category).map((v) => v.id),
    expiresAt: new Date(Date.now() + EXPIRY_DAYS * 86_400_000).toISOString(),
    createdAt: new Date().toISOString(),
  };
  d.orders.push(order);
  await saveDb();
}

export const mockApi: Api = {
  async requestOtp(email) {
    await delay(500);
    void email;
    return { requestId: id('otp') };
  },

  // Any 6-digit code is accepted except 000000, kept invalid so the error
  // state is easy to demo.
  async verifyOtp(_requestId, code) {
    await delay(600);
    if (code === '000000' || code.length !== 6) {
      throw new ApiError('unknown', 'wrong otp');
    }
    const d = await loadDb();
    return { token: `mock-token-${Date.now()}`, user: d.user };
  },

  async setPin(_pinHash) {
    await delay(200);
    return { ok: true };
  },

  async getMe() {
    const d = await loadDb();
    if (!d.user) throw new ApiError('unknown', 'no user');
    return d.user;
  },

  async patchMe(patch) {
    const d = await loadDb();
    if (!d.user) throw new ApiError('unknown', 'no user');
    d.user = { ...d.user, ...patch };
    await saveDb();
    return d.user;
  },

  async createProfile(input) {
    const d = await loadDb();
    d.user = {
      id: id('usr'),
      role: input.role,
      name: input.name,
      email: input.email,
      language: input.language,
      currency: SENDER_CURRENCY,
      createdAt: new Date().toISOString(),
    };
    await saveDb();
    return d.user;
  },

  async listRecipients() {
    await delay(250);
    const d = await loadDb();
    return d.recipients;
  },

  async createRecipient(input) {
    await delay(300);
    const d = await loadDb();
    const recipient: Recipient = { ...input, id: id('rcp'), senderId: d.user?.id ?? 'usr_local' };
    d.recipients.push(recipient);
    await saveDb();
    return recipient;
  },

  async listPackages(_recipientId) {
    await delay(300);
    return buildPackageTemplates();
  },

  async createOrder(input) {
    await delay(350);
    const d = await loadDb();
    const template = templateById(input.templateId);
    if (!template) throw new ApiError('unknown', 'bad template');
    const { amountLocal, amountSender, serviceFee } = priceOrder(input.items, template);
    const order: Order = {
      id: id('ord'),
      senderId: d.user?.id ?? 'usr_local',
      recipientId: input.recipientId,
      templateId: input.templateId,
      items: input.items,
      message: input.message,
      amountSenderCurrency: amountSender + serviceFee,
      amountLocalCurrency: amountLocal,
      fxRate: FX_RATE,
      serviceFee,
      status: 'created',
      claimCode: makeClaimCode(),
      eligibleVendorIds: eligibleVendorsFor(template.category).map((v) => v.id),
      expiresAt: new Date(Date.now() + EXPIRY_DAYS * 86_400_000).toISOString(),
      createdAt: new Date().toISOString(),
    };
    d.orders.push(order);
    await saveDb();
    return order;
  },

  // paymentMethodId 'pm_fail' simulates a declined card so the failure state
  // is demoable. Idempotency: re-sending the same idemKey never double-pays.
  async payOrder(orderId, paymentMethodId, idemKey) {
    await delay(1200);
    const d = await loadDb();
    const order = d.orders.find((o) => o.id === orderId);
    if (!order) throw new ApiError('unknown', 'order not found');
    if (d.idempotency[idemKey]) return order;
    if (paymentMethodId === 'pm_fail') throw new ApiError('payment_failed', 'card declined');
    order.status = 'paid';
    d.paidAt[order.id] = new Date().toISOString();
    d.idempotency[idemKey] = order.id;
    await saveDb();
    return order;
  },

  async listOrders(role) {
    await delay(300);
    const d = await loadDb();
    if (role === 'recipient' && d.user?.role === 'recipient') await seedRecipientDemo(d);
    await progressOrders(d);
    const visible =
      role === 'recipient'
        ? d.orders.filter((o) => ['ready', 'collected', 'expired'].includes(o.status))
        : d.orders.filter((o) => o.status !== 'created');
    return [...visible].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getOrder(orderId) {
    await delay(200);
    const d = await loadDb();
    await progressOrders(d);
    const order = d.orders.find((o) => o.id === orderId);
    if (!order) throw new ApiError('unknown', 'order not found');
    return order;
  },

  async listVendors(_near) {
    await delay(300);
    return MOCK_VENDORS;
  },

  async listNudges() {
    await delay(300);
    const d = await loadDb();
    return buildMockNudges(d.user?.id ?? 'usr_local');
  },

  async redeemLookup(claimCode) {
    await delay(400);
    const d = await loadDb();
    await progressOrders(d);
    const normalized = claimCode.trim().toUpperCase();
    const order = d.orders.find((o) => o.claimCode.toUpperCase() === normalized);
    if (!order || order.status === 'created' || order.status === 'paid') {
      throw new ApiError('invalid_code');
    }
    if (order.status === 'collected') {
      throw new ApiError('already_redeemed', undefined, {
        date: order.proof ? new Date(order.proof.collectedAt).toLocaleDateString() : '',
      });
    }
    if (order.status === 'expired' || new Date(order.expiresAt).getTime() < Date.now()) {
      throw new ApiError('expired_code');
    }
    return order;
  },

  async redeemConfirm(input) {
    await delay(500);
    const d = await loadDb();
    const order = d.orders.find((o) => o.id === input.orderId);
    if (!order) throw new ApiError('invalid_code');
    if (d.idempotency[input.idemKey]) return order;
    if (order.status === 'collected') {
      throw new ApiError('already_redeemed', undefined, {
        date: order.proof ? new Date(order.proof.collectedAt).toLocaleDateString() : '',
      });
    }
    order.status = 'collected';
    order.proof = {
      vendorId: 'ven_wing_kee',
      collectedAt: new Date().toISOString(),
      photoUrl: input.photoUri,
      note: input.note,
      location: input.location ?? MOCK_VENDORS[0]!.location,
      itemsDelivered: order.items,
    };
    d.idempotency[input.idemKey] = order.id;
    await saveDb();
    return order;
  },
};

/** Test/demo helper: wipe the mock backend (used from profile screens). */
export async function resetMockDb(): Promise<void> {
  db = { ...emptyDb, recipients: [], orders: [], paidAt: {}, idempotency: {} };
  await AsyncStorage.removeItem(DB_KEY);
}

export { MOCK_VENDORS, LOCAL_CURRENCY, SENDER_CURRENCY, FX_RATE };
export type { HealthNudge, Order, Recipient, User, Vendor };
