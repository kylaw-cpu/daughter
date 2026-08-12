import Constants from 'expo-constants';
import type { Api } from './contract';
import { mockApi } from './mockApi';
import { createHttpApi } from './httpApi';

const USE_MOCK_API: boolean = Constants.expoConfig?.extra?.USE_MOCK_API ?? true;
const API_URL: string = Constants.expoConfig?.extra?.API_URL ?? 'https://api.sendplate.example';

/** The one API entry point the app imports. Mock vs real is an env flag. */
export const api: Api = USE_MOCK_API ? mockApi : createHttpApi(API_URL);

export * from './types';
