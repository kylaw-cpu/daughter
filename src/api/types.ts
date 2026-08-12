/** Client-side data models — mirror of spec Section 9. Backend mirrors these. */

export type Role = 'sender' | 'recipient' | 'vendor';

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string; // account identity + verification channel
  phone?: string; // optional, E.164 — for SMS features later
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
}

export interface PackageTemplate {
  id: string;
  key: string; // 'kids_protein', 'mother_baby'...
  name: string; // localized
  description: string; // localized, plain language
  glyph: string; // asset key
  category: 'food' | 'health' | 'mixed';
  baseItems: PackageItem[];
  addOns: PackageItem[];
  /** Integer minor units, recipient local currency (money is never floats). */
  basePriceLocal: number;
  popular?: boolean;
}

export interface PackageItem {
  key: string;
  label: string; // 'Eggs (30)', 'Iron supplement'
  nutrients?: string[]; // ['protein', 'iron', 'vitamin_a']
  quantity: number;
}

export type OrderStatus =
  | 'created'
  | 'paid'
  | 'ready'
  | 'collected'
  | 'expired'
  | 'refunded';

export interface Order {
  id: string;
  senderId: string;
  recipientId: string;
  templateId: string;
  items: PackageItem[];
  message?: { type: 'text' | 'voice'; content: string };
  /** Integer minor units (cents) to avoid float errors. */
  amountSenderCurrency: number;
  amountLocalCurrency: number;
  fxRate: number;
  serviceFee: number;
  status: OrderStatus;
  claimCode: string; // human-readable + encodes to QR
  eligibleVendorIds: string[];
  expiresAt: string;
  createdAt: string;
  proof?: Proof;
}

export interface Proof {
  vendorId: string;
  collectedAt: string;
  photoUrl: string;
  note?: string;
  location?: { lat: number; lng: number };
  itemsDelivered: PackageItem[];
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
}

export interface HealthNudge {
  id: string;
  recipientId: string;
  icon: string;
  message: string; // localized, one sentence
  action?: { label: string; type: 'clinic' | 'reminder' | 'link'; payload: string };
  priority: 'normal' | 'alert';
  expiresAt?: string;
}

/** Vendor-side redemption queued while offline (spec §11). */
export interface QueuedRedemption {
  orderId: string;
  claimCode: string;
  photoUri: string;
  note?: string;
  queuedAt: string;
  synced: boolean;
}

export class ApiError extends Error {
  constructor(
    public code:
      | 'invalid_code'
      | 'already_redeemed'
      | 'expired_code'
      | 'network'
      | 'payment_failed'
      | 'unknown',
    message?: string,
    public meta?: Record<string, string>
  ) {
    super(message ?? code);
  }
}
