import { PaymentProvider, PaymentResult } from './PaymentProvider';

/**
 * Test-mode payment: simulates a card payment sheet result with realistic
 * latency. Roughly 1 in 8 payments "fails" so the failure path (retry
 * without losing the order, spec §6.2 Pay) actually gets exercised in
 * demos.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock';

  async presentPaymentSheet(): Promise<PaymentResult> {
    await new Promise((resolve) => setTimeout(resolve, 1200 + Math.random() * 800));
    const failed = Math.random() < 0.125;
    if (failed) {
      return {
        status: 'failed',
        paymentMethodId: 'pm_mock_visa',
        errorMessage: 'card_declined',
      };
    }
    return { status: 'succeeded', paymentMethodId: 'pm_mock_visa' };
  }
}
