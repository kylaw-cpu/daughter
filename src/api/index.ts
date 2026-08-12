import Constants from 'expo-constants';
import type { Api } from './contract';
import { mockApi } from './mockApi';
import { createHttpApi } from './httpApi';
import { ApiError } from './types';

const extra = Constants.expoConfig?.extra ?? {};
const USE_MOCK_API: boolean = extra.USE_MOCK_API ?? true;
const API_URL: string = extra.API_URL ?? 'https://api.sendplate.example';

/**
 * Optional real auth service (server/index.mjs + Resend). When set, OTP
 * request/verify hit it — real verification codes by email — while the rest
 * of the app keeps running on the mock until the full backend lands.
 * Set at build/start time, e.g.:
 *   EXPO_PUBLIC_AUTH_API_URL=http://192.168.1.20:8787 npx expo start
 */
const AUTH_API_URL: string | undefined =
  extra.AUTH_API_URL ?? process.env.EXPO_PUBLIC_AUTH_API_URL ?? undefined;

const base: Api = USE_MOCK_API ? mockApi : createHttpApi(API_URL);

async function authPost<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${AUTH_API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError('network');
  }
  const data = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
  if (!res.ok) throw new ApiError((data.code as ApiError['code']) ?? 'unknown', data.message);
  return data as T;
}

const withRealAuth: Api = {
  ...base,
  requestOtp: (email) => authPost<{ requestId: string }>('/auth/otp/request', { email }),
  async verifyOtp(requestId, code) {
    // The auth service is the authority on the code…
    const { token } = await authPost<{ token: string }>('/auth/otp/verify', { requestId, code });
    // …while the local profile (mock DB until Phase 4) decides whether this
    // device already has an account, so returning users skip setup.
    const user = await base.getMe().catch(() => null);
    return { token, user };
  },
};

/** The one API entry point the app imports. */
export const api: Api = AUTH_API_URL ? withRealAuth : base;

export * from './types';
