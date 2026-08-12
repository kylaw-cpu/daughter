import axios, { AxiosInstance } from 'axios';
import { secureGet, secureSet } from '@/lib/secureStorage';
import type { Api } from './contract';
import { ApiError } from './types';

const TOKEN_KEY = 'sendplate.token';

export async function saveToken(token: string) {
  await secureSet(TOKEN_KEY, token);
}

/**
 * Real backend client (Phase 4, spec §10). Thin axios wrapper with auth +
 * generous timeouts (target users are on 2G). Retry/offline-queue interceptors
 * land with the real backend; until then the app runs on USE_MOCK_API.
 */
export function createHttpApi(baseURL: string): Api {
  const client: AxiosInstance = axios.create({ baseURL, timeout: 30_000 });

  client.interceptors.request.use(async (config) => {
    const token = await secureGet(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(undefined, (error) => {
    if (!error.response) throw new ApiError('network');
    const code = error.response.data?.code;
    throw new ApiError(code ?? 'unknown', error.response.data?.message);
  });

  return {
    requestOtp: async (phone) => (await client.post('/auth/otp/request', { phone })).data,
    verifyOtp: async (requestId, code) =>
      (await client.post('/auth/otp/verify', { requestId, code })).data,
    setPin: async (pinHash) => (await client.post('/auth/pin', { pinHash })).data,
    getMe: async () => (await client.get('/me')).data,
    patchMe: async (patch) => (await client.patch('/me', patch)).data,
    createProfile: async (input) => (await client.patch('/me', input)).data,
    listRecipients: async () => (await client.get('/recipients')).data,
    createRecipient: async (input) => (await client.post('/recipients', input)).data,
    listPackages: async (recipientId) =>
      (await client.get('/packages', { params: { recipientId } })).data,
    createOrder: async (input) => (await client.post('/orders', input)).data,
    payOrder: async (orderId, paymentMethodId, idemKey) =>
      (await client.post(`/orders/${orderId}/pay`, { paymentMethodId, idemKey })).data,
    listOrders: async (role) => (await client.get('/orders', { params: { role } })).data,
    getOrder: async (orderId) => (await client.get(`/orders/${orderId}`)).data,
    listVendors: async (near) =>
      (
        await client.get('/vendors', {
          params: near ? { near: `${near.lat},${near.lng}` } : undefined,
        })
      ).data,
    listNudges: async () => (await client.get('/nudges')).data,
    redeemLookup: async (claimCode) => (await client.post('/redeem/lookup', { claimCode })).data,
    redeemConfirm: async (input) => (await client.post('/redeem/confirm', input)).data,
  };
}
