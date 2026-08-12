import type {
  HealthNudge,
  Order,
  PackageItem,
  PackageTemplate,
  Recipient,
  User,
  Vendor,
} from './types';

/**
 * The app-facing API contract (spec §10). The mock (Phase 0–3) and the real
 * HTTP client (Phase 4) both implement this, swapped by USE_MOCK_API.
 */
export interface Api {
  // Auth
  requestOtp(phone: string): Promise<{ requestId: string }>;
  verifyOtp(requestId: string, code: string): Promise<{ token: string; user: User | null }>;
  setPin(pinHash: string): Promise<{ ok: boolean }>;

  // Me
  getMe(): Promise<User>;
  patchMe(patch: Partial<Pick<User, 'name' | 'language' | 'role' | 'photoUrl'>>): Promise<User>;
  /** Mock-only convenience for first-run profile setup. */
  createProfile(input: { name: string; role: User['role']; phone: string; language: string }): Promise<User>;

  // Sender
  listRecipients(): Promise<Recipient[]>;
  createRecipient(input: Omit<Recipient, 'id' | 'senderId'>): Promise<Recipient>;
  listPackages(recipientId: string): Promise<PackageTemplate[]>;
  createOrder(input: {
    recipientId: string;
    templateId: string;
    items: PackageItem[];
    message?: Order['message'];
  }): Promise<Order>;
  payOrder(orderId: string, paymentMethodId: string, idemKey: string): Promise<Order>;
  listOrders(role: 'sender' | 'recipient'): Promise<Order[]>;
  getOrder(id: string): Promise<Order>;

  // Recipient
  listVendors(near?: { lat: number; lng: number }): Promise<Vendor[]>;
  listNudges(): Promise<HealthNudge[]>;

  // Vendor
  redeemLookup(claimCode: string): Promise<Order>;
  redeemConfirm(input: {
    orderId: string;
    photoUri: string;
    note?: string;
    location?: { lat: number; lng: number };
    idemKey: string;
  }): Promise<Order>;
}
