/**
 * Payment abstraction (spec §4): the send flow only ever talks to this
 * interface, so card payments (Stripe) and mobile-money providers
 * (M-Pesa, …) are interchangeable implementations.
 */
export interface PaymentResult {
  status: 'succeeded' | 'failed' | 'pending';
  paymentMethodId: string;
  errorMessage?: string;
}

export interface PaymentProvider {
  readonly name: string;
  /**
   * Present the provider's payment UI for the amount (minor units) and
   * resolve with the outcome. Must never throw for a declined payment —
   * that's a `failed` result the UI handles without losing the order.
   */
  presentPaymentSheet(params: {
    amountMinor: number;
    currency: string;
    orderId: string;
  }): Promise<PaymentResult>;
}
