/**
 * Funnel instrumentation (spec §14) — wired from Phase 1 against the mock so
 * the funnel is visible early. The transport is a console sink for now; swap
 * `sink` for a real analytics SDK in Phase 5 without touching call sites.
 */

type EventName =
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'send_flow_started'
  | 'package_selected'
  | 'order_reviewed'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'proof_viewed'
  | 'code_shown'
  | 'code_redeemed'
  | 'nudge_tapped'
  | 'clinic_referral_clicked'
  | 'repeat_send';

let sink: (name: EventName, props?: Record<string, string | number | boolean>) => void = (
  name,
  props
) => {
  if (__DEV__) console.log(`[analytics] ${name}`, props ?? {});
};

export function track(name: EventName, props?: Record<string, string | number | boolean>) {
  try {
    sink(name, props);
  } catch {
    // Analytics must never break the app.
  }
}

export function setAnalyticsSink(fn: typeof sink) {
  sink = fn;
}
