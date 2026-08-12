/**
 * Client-side data models (spec §9). These shapes mirror the backend
 * contract in spec §10 and are served by the mock API until Phase 4.
 * All money values are integer minor units (cents) to avoid float errors.
 */

export type Role = 'sender' | 'recipient' | 'vendor';

export interface User {
  id: string;
  role: Role;
  name: string;
  phone: string; // E.164
  photoUrl?: string;
  language: string; // BCP-47, e.g. 'sw', 'ar', 'en'
  currency: string; // ISO 4217, sender's currency
  createdAt: string;
}

/** A person a sender supports. */
export interface Recipient {
  id: string;
  senderId: string;
  name: string;
  phone: string;
  relationship: string; // 'mother', 'sister', 'child'...
  town: string;
  language: string;
  linkedUserId?: string; // if recipient also has an app account
  /** Set when the recipient has no smartphone and gets codes by SMS only. */
  smsOnly?: boolean;
  lastReceivedAt?: string;
}

export interface PackageItem {
  key: string;
  label: string; // 'Eggs (30)', 'Iron supplement'
  nutrients?: string[]; // ['protein', 'iron', 'vitamin_a']
  quantity: number;
  /** Price of one unit in local-currency minor units (client pricing for mock). */
  unitPriceLocal: number;
}

export interface PackageTemplate {
  id: string;
  key: string; // 'kids_protein', 'mother_baby'...
  name: string; // localized
  description: string; // localized, plain language
  /** Plain-language line about who it helps, e.g. "~2 weeks for 2 children". */
  coverage: string;
  glyph: string; // asset key, see PackageGlyph component
  category: 'food' | 'health' | 'mixed';
  baseItems: PackageItem[];
  addOns: PackageItem[];
  basePriceLocal: number; // minor units, recipient local currency
  popular?: boolean;
}

export type OrderStatus =
  | 'created'
  | 'paid'
  | 'ready'
  | 'collected'
  | 'expired'
  | 'refunded';

export interface Proof {
  vendorId: string;
  vendorName: string;
  collectedAt: string;
  photoUrl: string;
  note?: string;
  location?: { lat: number; lng: number };
  itemsDelivered: PackageItem[];
}

export interface OrderMessage {
  type: 'text' | 'voice';
  content: string;
}

export interface Order {
  id: string;
  senderId: string;
  /** Denormalized for the recipient's "From your daughter" moment. */
  senderName: string;
  recipientId: string;
  recipientName: string;
  templateId: string;
  templateKey: string;
  templateName: string;
  glyph: string;
  items: PackageItem[];
  message?: OrderMessage;
  /** Sender-currency minor units. */
  amountSenderCurrency: number;
  /** Local-currency minor units — what the family receives in value. */
  amountLocalCurrency: number;
  fxRate: number;
  /** Sender-currency minor units. */
  serviceFee: number;
  senderCurrency: string;
  localCurrency: string;
  status: OrderStatus;
  claimCode: string; // human-readable + encodes to QR
  eligibleVendorIds: string[];
  expiresAt: string;
  createdAt: string;
  proof?: Proof;
}

export interface Vendor {
  id: string;
  name: string;
  type: 'food' | 'pharmacy' | 'clinic' | 'market';
  location: { lat: number; lng: number };
  address: string;
  hours: string;
  verified: boolean;
  offeredCategories: Array<'food' | 'health'>;
  /** Distance from the recipient, in km (computed server-side / mocked). */
  distanceKm?: number;
}

export interface HealthNudge {
  id: string;
  recipientId: string;
  icon: string; // Feather icon name
  message: string; // localized, one sentence
  action?: { label: string; type: 'clinic' | 'reminder' | 'link'; payload: string };
  priority: 'normal' | 'alert';
  expiresAt?: string;
}

/** A vendor redemption queued locally while offline (spec §11). */
export interface PendingRedemption {
  id: string;
  orderId: string;
  claimCode: string;
  note?: string;
  photoUri?: string;
  queuedAt: string;
  status: 'pending' | 'synced' | 'conflict';
}
