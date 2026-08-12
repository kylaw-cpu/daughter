/**
 * Active payment provider selection.
 *
 * Phases 1–3 use MockPaymentProvider so the demo needs no Stripe account,
 * no PaymentIntent backend, and no native module — this also keeps the
 * download small (spec §3) and lets the flow run in Expo Go.
 *
 * Phase 4: add `@stripe/stripe-react-native`, implement
 * StripePaymentProvider against POST /orders/:id/pay (server creates the
 * PaymentIntent), and swap it in here. The send flow won't change — it only
 * knows the PaymentProvider interface.
 */
import { MockPaymentProvider } from './mockPaymentProvider';
import { PaymentProvider } from './PaymentProvider';

export const paymentProvider: PaymentProvider = new MockPaymentProvider();

export type { PaymentProvider, PaymentResult } from './PaymentProvider';
