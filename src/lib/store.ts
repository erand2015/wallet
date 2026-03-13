import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletState {
  address: string | null;
  vault: string | null; 
  isLocked: boolean;
  setVault: (vault: string, address: string) => void;
  lock: () => void;
  unlock: () => void;
  logout: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      address: null,
      vault: null,
      isLocked: true,
      setVault: (vault, address) => set({ vault, address, isLocked: false }),
      lock: () => set({ isLocked: true }),
      unlock: () => set({ isLocked: false }),
      logout: () => {
        set({ address: null, vault: null, isLocked: true });
      },
    }),
    { name: 'wart-pro-storage' }
  )
);