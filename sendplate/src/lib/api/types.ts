import {
  HealthNudge,
  Order,
  OrderMessage,
  PackageItem,
  PackageTemplate,
  Recipient,
  Role,
  User,
  Vendor,
} from '@/models/types';

/**
 * Typed error the whole app can branch on. Screens translate `code` into
 * plain language — raw codes are never shown to users (spec §7).
 */
export class ApiError extends Error {
  constructor(
    public code:
      | 'INVALID_CODE'
      | 'ALREADY_REDEEMED'
      | 'EXPIRED_CODE'
      | 'INVALID_OTP'
      | 'PAYMENT_FAILED'
      | 'NOT_FOUND'
      | 'NETWORK'
      | 'UNKNOWN',
    message?: string,
    /** For ALREADY_REDEEMED: when it was collected. */
    public detail?: string
  ) {
    super(message ?? code);
    this.name = 'ApiError';
  }
}

export interface CreateOrderInput {
  recipientId: string;
  templateId: string;
  items: PackageItem[];
  message?: OrderMessage;
}

export interface CreateRecipientInput {
  name: string;
  phone: string;
  relationship: string;
  town: string;
  language: string;
}

export interface RedeemConfirmInput {
  orderId: string;
  photoUri?: string;
  note?: string;
  location?: { lat: number; lng: number };
  idemKey: string;
}

/**
 * The backend contract (spec §10) as a client interface. `mockApi`
 * implements it locally; the Phase 4 real client implements the same
 * interface over HTTPS — screens never know which one they're talking to.
 */
export interface Api {
  // Auth
  requestOtp(phone: string): Promise<{ requestId: string }>;
  verifyOtp(requestId: string, code: string, role: Role, language: string): Promise<{ token: string; user: User }>;
  setPin(pinHash: string): Promise<{ ok: boolean }>;
  getMe(): Promise<User>;
  updateMe(patch: Partial<Pick<User, 'name' | 'language' | 'photoUrl'>>): Promise<User>;

  // Sender
  getRecipients(): Promise<Recipient[]>;
  createRecipient(input: CreateRecipientInput): Promise<Recipient>;
  getPackages(recipientId: string): Promise<PackageTemplate[]>;
  createOrder(input: CreateOrderInput): Promise<Order>;
  payOrder(orderId: string, paymentMethodId: string, idemKey: string): Promise<Order>;
  getOrders(role: 'sender' | 'recipient'): Promise<Order[]>;
  getOrder(orderId: string): Promise<Order>;

  // Recipient
  getVendors(near?: { lat: number; lng: number }): Promise<Vendor[]>;
  getNudges(): Promise<HealthNudge[]>;

  // Vendor
  redeemLookup(claimCode: string): Promise<Order>;
  redeemConfirm(input: RedeemConfirmInput): Promise<Order>;
}
