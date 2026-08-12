import Constants from 'expo-constants';
import type { Api } from './contract';
import { mockApi } from './mockApi';
import { createHttpApi } from './httpApi';

const extra = Constants.expoConfig?.extra ?? {};
const USE_MOCK_API: boolean = extra.USE_MOCK_API ?? true;
const API_URL: string = extra.API_URL ?? 'https://api.sendplate.example';

/**
 * The one API entry point the app imports. Fully self-contained by default:
 * the on-device mock backend needs no server and no third-party services.
 * A self-hosted backend can be swapped in later via USE_MOCK_API=false.
 */
export const api: Api = USE_MOCK_API ? mockApi : createHttpApi(API_URL);

export * from './types';
