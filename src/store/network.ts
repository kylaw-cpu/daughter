import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { create } from 'zustand';

interface NetworkState {
  online: boolean;
  setOnline(online: boolean): void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  online: true,
  setOnline: (online) => set({ online }),
}));

/** Subscribe once at the root; read `useNetworkStore` anywhere. */
export function useNetworkSubscription() {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // Treat unknown reachability as online; the UI should only claim
      // "offline" when we are sure (2G users see enough false alarms).
      useNetworkStore.getState().setOnline(state.isConnected !== false);
    });
    return unsubscribe;
  }, []);
}

export function useOnline(): boolean {
  return useNetworkStore((s) => s.online);
}
