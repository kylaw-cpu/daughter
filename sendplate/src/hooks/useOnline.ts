import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';
import { create } from 'zustand';

interface NetworkState {
  online: boolean;
  setOnline: (online: boolean) => void;
}

/**
 * Single network-state store; screens read `online` and the vendor offline
 * queue watches it to know when to sync (spec §7/§11). Treats "unknown"
 * as online so we never scare users unnecessarily.
 */
export const useNetworkStore = create<NetworkState>((set) => ({
  online: true,
  setOnline: (online) => set({ online }),
}));

let subscribed = false;

export function useOnline(): boolean {
  const online = useNetworkStore((s) => s.online);
  const setOnline = useNetworkStore((s) => s.setOnline);

  useEffect(() => {
    if (subscribed) return;
    subscribed = true;
    NetInfo.addEventListener((state) => {
      setOnline(state.isConnected !== false);
    });
  }, [setOnline]);

  return online;
}
