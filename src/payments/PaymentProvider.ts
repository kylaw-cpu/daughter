/**
 * Payment abstraction (spec §4): Stripe first, architected so mobile-money
 * providers (M-Pesa etc.) slot in later without touching the send flow.
 */
export interface PaymentResult {
  status: 'succeeded' | 'failed' | 'pending';
  paymentMethodId: string;
  errorMessage?: string;
}

export interface PaymentProvider {
  readonly id: string;
  /** Presents the provider's payment UI and resolves with the outcome. */
  collectPayment(input: {
    amountMinorUnits: number;
    currency: string;
    orderId: string;
  }): Promise<PaymentResult>;
}

/**
 * Demo provider used while USE_MOCK_API is on. The real
 * `@stripe/stripe-react-native` PaymentSheet implementation lands in Phase 4
 * behind this same interface (it needs a backend to mint PaymentIntents, so
 * wiring it before the backend exists would be dead code — reasonable-choice
 * note per spec §0).
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly id = 'mock';

  constructor(private simulate: 'succeed' | 'fail' | 'pending' = 'succeed') {}

  async collectPayment(): Promise<PaymentResult> {
    await new Promise((r) => setTimeout(r, 1400));
    if (this.simulate === 'fail') {
      return { status: 'failed', paymentMethodId: 'pm_fail', errorMessage: 'Card declined' };
    }
    if (this.simulate === 'pending') {
      return { status: 'pending', paymentMethodId: 'pm_pending' };
    }
    return { status: 'succeeded', paymentMethodId: 'pm_card_visa' };
  }
}

export function getPaymentProvider(simulate?: 'succeed' | 'fail' | 'pending'): PaymentProvider {
  return new MockPaymentProvider(simulate);
}
