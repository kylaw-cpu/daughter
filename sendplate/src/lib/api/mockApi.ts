/**
 * In-app mock backend (spec §10 "Mock layer") backed by AsyncStorage so the
 * entire app is demoable before the backend exists — including playing all
 * three roles on a single device: the sender's orders appear on the
 * recipient home, and codes redeemed on the vendor screen turn into proof
 * on the sender's activity feed.
 *
 * Swap to the real client via EXPO_PUBLIC_USE_MOCK_API (see ./index.ts).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';
import {
  HealthNudge,
  Order,
  PackageItem,
  PackageTemplate,
  Recipient,
  Role,
  User,
  Vendor,
} from '@/models/types';
import {
  Api,
  ApiError,
  CreateOrderInput,
  CreateRecipientInput,
  RedeemConfirmInput,
} from './types';

const DB_KEY = 'sendplate.mockdb.v1';
const FX_RATE = 129.35; // KES per USD, locked into orders at review time
const SENDER_CURRENCY = 'USD';
const LOCAL_CURRENCY = 'KES';
const SERVICE_FEE_MINOR = 99; // $0.99 flat fee — always shown, never hidden
const ORDER_TTL_DAYS = 7;
/** A paid order becomes "ready" once vendors are notified (simulated). */
const PAID_TO_READY_MS = 10_000;
export const DEMO_OTP = '123456';

interface MockDb {
  users: User[];
  /** userId per role, so one device can hop between roles in the demo. */
  sessions: Partial<Record<Role, string>>;
  recipients: Recipient[];
  orders: Order[];
  usedIdemKeys: string[];
  otpRequests: Record<string, { phone: string }>;
  pinHashes: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Static world data (vendors around Kisumu; template catalog)
// ---------------------------------------------------------------------------

const VENDORS: Vendor[] = [
  {
    id: 'v_mama_pima',
    name: "Mama Pima's Grocery",
    type: 'food',
    location: { lat: -0.0917, lng: 34.768 },
    address: 'Oginga Odinga St, Kisumu',
    hours: '7:00 – 19:00',
    verified: true,
    offeredCategories: ['food'],
    distanceKm: 0.8,
  },
  {
    id: 'v_jubilee_market',
    name: 'Jubilee Fresh Market',
    type: 'market',
    location: { lat: -0.0989, lng: 34.7554 },
    address: 'Jubilee Market, Kisumu',
    hours: '6:00 – 18:00',
    verified: true,
    offeredCategories: ['food'],
    distanceKm: 1.6,
  },
  {
    id: 'v_afya_pharmacy',
    name: 'Afya Bora Pharmacy',
    type: 'pharmacy',
    location: { lat: -0.0895, lng: 34.7621 },
    address: 'Angawa Ave, Kisumu',
    hours: '8:00 – 20:00',
    verified: true,
    offeredCategories: ['health'],
    distanceKm: 1.1,
  },
  {
    id: 'v_tumaini_clinic',
    name: 'Tumaini Community Clinic',
    type: 'clinic',
    location: { lat: -0.105, lng: 34.75 },
    address: 'Nyalenda, Kisumu',
    hours: 'Mon–Sat 8:00 – 17:00',
    verified: true,
    offeredCategories: ['health'],
    distanceKm: 2.4,
  },
];

interface TemplateDef {
  key: string;
  glyph: string;
  category: PackageTemplate['category'];
  baseItems: Array<{ key: string; quantity: number; unitPriceLocal: number; nutrients?: string[] }>;
  addOns: Array<{ key: string; quantity: number; unitPriceLocal: number; nutrients?: string[] }>;
  popular?: boolean;
  eligibleVendorIds: string[];
}

// Prices are KES minor units (cents).
const TEMPLATE_DEFS: TemplateDef[] = [
  {
    key: 'kids_protein',
    glyph: 'kids_protein',
    category: 'food',
    popular: true,
    baseItems: [
      { key: 'eggs_30', quantity: 1, unitPriceLocal: 45000, nutrients: ['protein'] },
      { key: 'lentils_2kg', quantity: 1, unitPriceLocal: 38000, nutrients: ['protein', 'iron'] },
      { key: 'porridge_fortified', quantity: 1, unitPriceLocal: 32000, nutrients: ['iron', 'vitamin_a'] },
    ],
    addOns: [
      { key: 'vitamin_a_drops', quantity: 1, unitPriceLocal: 15000, nutrients: ['vitamin_a'] },
      { key: 'deworming', quantity: 1, unitPriceLocal: 12000 },
      { key: 'extra_eggs', quantity: 1, unitPriceLocal: 45000, nutrients: ['protein'] },
    ],
    eligibleVendorIds: ['v_mama_pima', 'v_jubilee_market'],
  },
  {
    key: 'mother_baby',
    glyph: 'mother_baby',
    category: 'mixed',
    baseItems: [
      { key: 'prenatal_vitamins', quantity: 1, unitPriceLocal: 52000, nutrients: ['iron', 'folate'] },
      { key: 'clinic_checkup', quantity: 1, unitPriceLocal: 60000 },
      { key: 'iron_foods', quantity: 1, unitPriceLocal: 43000, nutrients: ['iron'] },
    ],
    addOns: [{ key: 'ors_zinc', quantity: 1, unitPriceLocal: 18000 }],
    eligibleVendorIds: ['v_afya_pharmacy', 'v_tumaini_clinic'],
  },
  {
    key: 'family_staples',
    glyph: 'family_staples',
    category: 'food',
    baseItems: [
      { key: 'maize_flour_10kg', quantity: 1, unitPriceLocal: 78000 },
      { key: 'beans_5kg', quantity: 1, unitPriceLocal: 65000, nutrients: ['protein', 'iron'] },
      { key: 'cooking_oil_2l', quantity: 1, unitPriceLocal: 52000 },
      { key: 'iron_supplement', quantity: 1, unitPriceLocal: 20000, nutrients: ['iron'] },
    ],
    addOns: [{ key: 'extra_eggs', quantity: 1, unitPriceLocal: 45000, nutrients: ['protein'] }],
    eligibleVendorIds: ['v_mama_pima', 'v_jubilee_market'],
  },
  {
    key: 'clinic_vitamins',
    glyph: 'clinic_vitamins',
    category: 'health',
    baseItems: [
      { key: 'clinic_consult', quantity: 1, unitPriceLocal: 80000 },
      { key: 'vitamins_30d', quantity: 1, unitPriceLocal: 42000, nutrients: ['vitamin_a', 'iron'] },
    ],
    addOns: [
      { key: 'deworming', quantity: 1, unitPriceLocal: 12000 },
      { key: 'ors_zinc', quantity: 1, unitPriceLocal: 18000 },
    ],
    eligibleVendorIds: ['v_afya_pharmacy', 'v_tumaini_clinic'],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(min = 250, max = 600) {
  const ms = min + Math.random() * (max - min);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function claimCode() {
  // Human-readable, unambiguous alphabet (no 0/O, 1/I).
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const pick = (n: number) =>
    Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  return `PLT-${pick(4)}-${pick(2)}`;
}

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
}

function localizeItem(item: { key: string; quantity: number; unitPriceLocal: number; nutrients?: string[] }): PackageItem {
  return {
    key: item.key,
    label: i18n.t(`packages.items.${item.key}`),
    quantity: item.quantity,
    unitPriceLocal: item.unitPriceLocal,
    nutrients: item.nutrients,
  };
}

function buildTemplates(): PackageTemplate[] {
  return TEMPLATE_DEFS.map((def) => ({
    id: `tpl_${def.key}`,
    key: def.key,
    name: i18n.t(`packages.${def.key}.name`),
    description: i18n.t(`packages.${def.key}.description`),
    coverage: i18n.t(`packages.${def.key}.coverage`),
    glyph: def.glyph,
    category: def.category,
    baseItems: def.baseItems.map(localizeItem),
    addOns: def.addOns.map(localizeItem),
    basePriceLocal: def.baseItems.reduce((sum, i) => sum + i.unitPriceLocal * i.quantity, 0),
    popular: def.popular,
  }));
}

// ---------------------------------------------------------------------------
// DB load / save / seed
// ---------------------------------------------------------------------------

let dbCache: MockDb | null = null;

function seedDb(): MockDb {
  // A believable starter world: one sender, one linked recipient household,
  // one vendor operator, and a past collected order so the proof feed and
  // recipient history aren't empty on first run.
  const senderId = 'u_sender_demo';
  const recipientUserId = 'u_recipient_demo';
  const vendorUserId = 'u_vendor_demo';
  const recId = 'rec_mama';

  const pastTemplate = TEMPLATE_DEFS[0];
  const pastItems = pastTemplate.baseItems.map(localizeItem);
  const pastLocal = pastItems.reduce((s, i) => s + i.unitPriceLocal * i.quantity, 0);

  const collectedOrder: Order = {
    id: 'ord_seed_collected',
    senderId,
    senderName: 'Amina',
    recipientId: recId,
    recipientName: 'Mama Achieng',
    templateId: 'tpl_kids_protein',
    templateKey: 'kids_protein',
    templateName: i18n.t('packages.kids_protein.name'),
    glyph: 'kids_protein',
    items: pastItems,
    amountSenderCurrency: Math.round(pastLocal / FX_RATE) + SERVICE_FEE_MINOR,
    amountLocalCurrency: pastLocal,
    fxRate: FX_RATE,
    serviceFee: SERVICE_FEE_MINOR,
    senderCurrency: SENDER_CURRENCY,
    localCurrency: LOCAL_CURRENCY,
    status: 'collected',
    claimCode: 'PLT-SEED-01',
    eligibleVendorIds: pastTemplate.eligibleVendorIds,
    expiresAt: daysFromNow(2),
    createdAt: daysFromNow(-5),
    proof: {
      vendorId: 'v_mama_pima',
      vendorName: "Mama Pima's Grocery",
      collectedAt: daysFromNow(-3),
      photoUrl: 'mock://proof/basket',
      note: 'Collected by Mama Achieng herself. All items fresh.',
      location: { lat: -0.0917, lng: 34.768 },
      itemsDelivered: pastItems,
    },
  };

  return {
    users: [
      {
        id: senderId,
        role: 'sender',
        name: 'Amina',
        phone: '+15550100001',
        language: 'en',
        currency: SENDER_CURRENCY,
        createdAt: daysFromNow(-30),
      },
      {
        id: recipientUserId,
        role: 'recipient',
        name: 'Mama Achieng',
        phone: '+254700000001',
        language: 'en',
        currency: LOCAL_CURRENCY,
        createdAt: daysFromNow(-30),
      },
      {
        id: vendorUserId,
        role: 'vendor',
        name: "Mama Pima's Grocery",
        phone: '+254700000002',
        language: 'en',
        currency: LOCAL_CURRENCY,
        createdAt: daysFromNow(-30),
      },
    ],
    sessions: {},
    recipients: [
      {
        id: recId,
        senderId,
        name: 'Mama Achieng',
        phone: '+254700000001',
        relationship: 'mother',
        town: 'Kisumu',
        language: 'en',
        linkedUserId: recipientUserId,
        lastReceivedAt: collectedOrder.proof!.collectedAt,
      },
    ],
    orders: [collectedOrder],
    usedIdemKeys: [],
    otpRequests: {},
    pinHashes: {},
  };
}

async function loadDb(): Promise<MockDb> {
  if (dbCache) return dbCache;
  try {
    const raw = await AsyncStorage.getItem(DB_KEY);
    dbCache = raw ? (JSON.parse(raw) as MockDb) : seedDb();
  } catch {
    dbCache = seedDb();
  }
  return dbCache;
}

async function saveDb(db: MockDb) {
  dbCache = db;
  try {
    await AsyncStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    // Persistence is best-effort in the mock; in-memory copy stays valid.
  }
}

/** Time-based status progression: paid → ready, ready → expired. */
function progressStatuses(db: MockDb): boolean {
  let changed = false;
  const now = Date.now();
  for (const order of db.orders) {
    if (order.status === 'paid' && now - Date.parse(order.createdAt) > PAID_TO_READY_MS) {
      order.status = 'ready';
      changed = true;
    }
    if (order.status === 'ready' && now > Date.parse(order.expiresAt)) {
      order.status = 'expired';
      changed = true;
    }
  }
  return changed;
}

async function currentUser(db: MockDb, role?: Role): Promise<User> {
  // The most recently authenticated role wins; role-specific lookups are
  // used by role-scoped calls.
  const roles: Role[] = role ? [role] : ['sender', 'recipient', 'vendor'];
  for (const r of roles) {
    const uid = db.sessions[r];
    const user = db.users.find((u) => u.id === uid);
    if (user) return user;
  }
  throw new ApiError('NOT_FOUND', 'Not signed in');
}

// ---------------------------------------------------------------------------
// The API implementation
// ---------------------------------------------------------------------------

export const mockApi: Api = {
  async requestOtp(phone) {
    await sleep();
    const db = await loadDb();
    const requestId = id('otp');
    db.otpRequests[requestId] = { phone };
    await saveDb(db);
    return { requestId };
  },

  async verifyOtp(requestId, code, role, language) {
    await sleep();
    const db = await loadDb();
    const request = db.otpRequests[requestId];
    if (!request || code !== DEMO_OTP) {
      throw new ApiError('INVALID_OTP');
    }
    delete db.otpRequests[requestId];

    let user = db.users.find((u) => u.phone === request.phone && u.role === role);
    if (!user) {
      // Demo shortcut: signing in with a fresh number under a role adopts the
      // seeded demo identity for that role, so the world stays connected.
      user =
        db.users.find((u) => u.role === role) ??
        ({
          id: id('u'),
          role,
          name: '',
          phone: request.phone,
          language,
          currency: role === 'sender' ? SENDER_CURRENCY : LOCAL_CURRENCY,
          createdAt: new Date().toISOString(),
        } as User);
      if (!db.users.includes(user)) db.users.push(user);
    }
    user.language = language;
    db.sessions[role] = user.id;
    await saveDb(db);
    return { token: `mock-token-${user.id}`, user };
  },

  async setPin(pinHash) {
    const db = await loadDb();
    const user = await currentUser(db);
    db.pinHashes[user.id] = pinHash;
    await saveDb(db);
    return { ok: true };
  },

  async getMe() {
    const db = await loadDb();
    return currentUser(db);
  },

  async updateMe(patch) {
    const db = await loadDb();
    const user = await currentUser(db);
    Object.assign(user, patch);
    await saveDb(db);
    return user;
  },

  async getRecipients() {
    await sleep();
    const db = await loadDb();
    const user = await currentUser(db, 'sender');
    return db.recipients.filter((r) => r.senderId === user.id);
  },

  async createRecipient(input: CreateRecipientInput) {
    await sleep();
    const db = await loadDb();
    const user = await currentUser(db, 'sender');
    const recipient: Recipient = {
      id: id('rec'),
      senderId: user.id,
      ...input,
    };
    db.recipients.push(recipient);
    await saveDb(db);
    return recipient;
  },

  async getPackages(_recipientId: string) {
    await sleep();
    return buildTemplates();
  },

  async createOrder(input: CreateOrderInput) {
    await sleep();
    const db = await loadDb();
    const user = await currentUser(db, 'sender');
    const recipient = db.recipients.find((r) => r.id === input.recipientId);
    const def = TEMPLATE_DEFS.find((d) => `tpl_${d.key}` === input.templateId);
    if (!recipient || !def) throw new ApiError('NOT_FOUND');

    const localTotal = input.items.reduce((sum, i) => sum + i.unitPriceLocal * i.quantity, 0);
    const order: Order = {
      id: id('ord'),
      senderId: user.id,
      senderName: user.name || 'Family',
      recipientId: recipient.id,
      recipientName: recipient.name,
      templateId: input.templateId,
      templateKey: def.key,
      templateName: i18n.t(`packages.${def.key}.name`),
      glyph: def.key,
      items: input.items,
      message: input.message,
      amountSenderCurrency: Math.round(localTotal / FX_RATE) + SERVICE_FEE_MINOR,
      amountLocalCurrency: localTotal,
      fxRate: FX_RATE,
      serviceFee: SERVICE_FEE_MINOR,
      senderCurrency: SENDER_CURRENCY,
      localCurrency: LOCAL_CURRENCY,
      status: 'created',
      claimCode: claimCode(),
      eligibleVendorIds: def.eligibleVendorIds,
      expiresAt: daysFromNow(ORDER_TTL_DAYS),
      createdAt: new Date().toISOString(),
    };
    db.orders.unshift(order);
    await saveDb(db);
    return order;
  },

  async payOrder(orderId, _paymentMethodId, idemKey) {
    await sleep(600, 1400);
    const db = await loadDb();
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) throw new ApiError('NOT_FOUND');
    if (db.usedIdemKeys.includes(idemKey)) return order; // idempotent replay
    db.usedIdemKeys.push(idemKey);
    order.status = 'paid';
    order.createdAt = new Date().toISOString(); // paid clock drives paid→ready
    order.expiresAt = daysFromNow(ORDER_TTL_DAYS);
    await saveDb(db);
    return order;
  },

  async getOrders(role) {
    await sleep();
    const db = await loadDb();
    if (progressStatuses(db)) await saveDb(db);
    if (role === 'sender') {
      const user = await currentUser(db, 'sender');
      return db.orders.filter((o) => o.senderId === user.id);
    }
    const user = await currentUser(db, 'recipient');
    const myRecipientIds = db.recipients
      .filter((r) => r.linkedUserId === user.id || r.phone === user.phone)
      .map((r) => r.id);
    return db.orders.filter((o) => myRecipientIds.includes(o.recipientId));
  },

  async getOrder(orderId) {
    await sleep();
    const db = await loadDb();
    if (progressStatuses(db)) await saveDb(db);
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) throw new ApiError('NOT_FOUND');
    return order;
  },

  async getVendors() {
    await sleep();
    return VENDORS;
  },

  async getNudges() {
    await sleep();
    const nudges: HealthNudge[] = [
      {
        id: 'n_vita',
        recipientId: 'rec_mama',
        icon: 'sun',
        message:
          i18n.language === 'ar'
            ? 'قطرات فيتامين أ مجانية للأطفال في عيادة توماييني يوم الخميس.'
            : 'Free Vitamin A drops for children at Tumaini Clinic this Thursday.',
        action: { label: i18n.t('health.seeClinic'), type: 'clinic', payload: 'v_tumaini_clinic' },
        priority: 'normal',
      },
      {
        id: 'n_water',
        recipientId: 'rec_mama',
        icon: 'droplet',
        message:
          i18n.language === 'ar'
            ? 'يوم صحي متنقل في نياليندا السبت القادم — فحوصات مجانية للأم والطفل.'
            : 'Mobile health day in Nyalenda next Saturday — free mother & child check-ups.',
        action: { label: i18n.t('health.remindMe'), type: 'reminder', payload: 'health_day' },
        priority: 'normal',
      },
    ];
    return nudges;
  },

  async redeemLookup(code) {
    await sleep();
    const db = await loadDb();
    if (progressStatuses(db)) await saveDb(db);
    const normalized = code.trim().toUpperCase();
    const order = db.orders.find((o) => o.claimCode.toUpperCase() === normalized);
    if (!order) throw new ApiError('INVALID_CODE');
    if (order.status === 'collected') {
      throw new ApiError('ALREADY_REDEEMED', undefined, order.proof?.collectedAt);
    }
    if (order.status === 'expired' || Date.now() > Date.parse(order.expiresAt)) {
      throw new ApiError('EXPIRED_CODE');
    }
    if (order.status !== 'ready' && order.status !== 'paid') {
      throw new ApiError('INVALID_CODE');
    }
    return order;
  },

  async redeemConfirm({ orderId, photoUri, note, location, idemKey }: RedeemConfirmInput) {
    await sleep(500, 1100);
    const db = await loadDb();
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) throw new ApiError('NOT_FOUND');
    if (db.usedIdemKeys.includes(idemKey)) return order;
    if (order.status === 'collected') {
      throw new ApiError('ALREADY_REDEEMED', undefined, order.proof?.collectedAt);
    }
    db.usedIdemKeys.push(idemKey);
    const vendorUser = db.users.find((u) => u.id === db.sessions.vendor);
    order.status = 'collected';
    order.proof = {
      vendorId: 'v_mama_pima',
      vendorName: vendorUser?.name || "Mama Pima's Grocery",
      collectedAt: new Date().toISOString(),
      photoUrl: photoUri ?? 'mock://proof/basket',
      note,
      location: location ?? { lat: -0.0917, lng: 34.768 },
      itemsDelivered: order.items,
    };
    const recipient = db.recipients.find((r) => r.id === order.recipientId);
    if (recipient) recipient.lastReceivedAt = order.proof.collectedAt;
    await saveDb(db);
    return order;
  },
};

/** Wipe the demo world (used from the profile screen for demos/testing). */
export async function resetMockDb() {
  dbCache = null;
  await AsyncStorage.removeItem(DB_KEY);
}
