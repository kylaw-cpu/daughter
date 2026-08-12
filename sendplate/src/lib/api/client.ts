/**
 * Axios instance for the Phase 4 real backend (spec §4/§10): auth header
 * injection, generous timeouts for 2G, and a simple retry-on-network-error
 * policy. Not used while USE_MOCK_API is on.
 */
import axios, { AxiosError, AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';

export const TOKEN_KEY = 'sendplate.token';

export function createHttpClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    // Users are on 2G/3G — be generous before declaring failure (spec §7).
    timeout: 30_000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use(async (config) => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // No token — request proceeds unauthenticated (auth endpoints).
    }
    return config;
  });

  client.interceptors.response.use(undefined, async (error: AxiosError) => {
    const config = error.config as (typeof error.config & { _retryCount?: number }) | undefined;
    // Retry idempotent reads a couple of times on flaky networks.
    const retriable =
      config && (!config.method || config.method.toLowerCase() === 'get') && !error.response;
    if (retriable) {
      config._retryCount = (config._retryCount ?? 0) + 1;
      if (config._retryCount <= 2) {
        await new Promise((r) => setTimeout(r, 1000 * config._retryCount!));
        return client.request(config);
      }
    }
    throw error;
  });

  return client;
}
