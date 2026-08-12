/**
 * API entry point. The whole app talks to `api` — which implementation
 * backs it is decided here (spec §10 "Swap via an env flag USE_MOCK_API").
 *
 * Default is the mock so the app is fully demoable with no backend.
 * Set EXPO_PUBLIC_USE_MOCK_API=false and EXPO_PUBLIC_API_URL=https://…
 * in Phase 4 to hit the real service.
 */
import { mockApi } from './mockApi';
import { Api } from './types';

const useMock = process.env.EXPO_PUBLIC_USE_MOCK_API !== 'false';

function createRealApi(): Api {
  // Phase 4: implement the Api interface over createHttpClient(...) from
  // ./client.ts, mapping each method to the REST endpoints in spec §10.
  // Kept unimplemented until a backend exists, so misconfiguration fails
  // loudly instead of silently hitting nothing.
  throw new Error(
    'Real API not wired yet (Phase 4). Unset EXPO_PUBLIC_USE_MOCK_API to keep using the mock.'
  );
}

export const api: Api = useMock ? mockApi : createRealApi();

export { ApiError } from './types';
export type { Api, CreateOrderInput, CreateRecipientInput, RedeemConfirmInput } from './types';
