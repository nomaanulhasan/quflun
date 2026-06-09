'use client';

import { createContext, useContext, useRef, useEffect, useState } from 'react';
import { createVaultStore, type VaultState } from '@/stores/vault-store';
import { createUIStore, type UIState } from '@/stores/ui-store';
import type { StoreApi } from 'zustand';
import { useStore } from 'zustand';

// ─── Vault Store Context ───────────────────────────────────────────────────────

type VaultStoreApi = StoreApi<VaultState>;

const VaultStoreContext = createContext<VaultStoreApi | null>(null);

export function useVaultStore(): VaultState;
export function useVaultStore<T>(selector: (state: VaultState) => T): T;
export function useVaultStore<T>(selector?: (state: VaultState) => T) {
  const store = useContext(VaultStoreContext);
  if (!store) throw new Error('useVaultStore must be used within Providers');
  return useStore(store, selector ?? ((s) => s as unknown as T));
}

// ─── UI Store Context ──────────────────────────────────────────────────────────

type UIStoreApi = StoreApi<UIState>;

const UIStoreContext = createContext<UIStoreApi | null>(null);

export function useUIStore(): UIState;
export function useUIStore<T>(selector: (state: UIState) => T): T;
export function useUIStore<T>(selector?: (state: UIState) => T) {
  const store = useContext(UIStoreContext);
  if (!store) throw new Error('useUIStore must be used within Providers');
  return useStore(store, selector ?? ((s) => s as unknown as T));
}

// ─── Provider Component ────────────────────────────────────────────────────────

/**
 * Lazily initializes services (crypto adapter, storage adapter, vault engine)
 * to avoid Turbopack trying to bundle argon2-browser WASM at build time.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const vaultStoreRef = useRef<VaultStoreApi | null>(null);
  const uiStoreRef = useRef<UIStoreApi | null>(null);

  useEffect(() => {
    async function init() {
      const { getServices } = await import('@/lib/runtime');
      const { engine, storage } = await getServices();

      if (!vaultStoreRef.current) {
        vaultStoreRef.current = createVaultStore(engine);
      }
      if (!uiStoreRef.current) {
        uiStoreRef.current = createUIStore(storage);
      }

      setReady(true);
    }

    init();
  }, []);

  if (!ready || !vaultStoreRef.current || !uiStoreRef.current) {
    // Loading state while services initialize
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <VaultStoreContext.Provider value={vaultStoreRef.current}>
      <UIStoreContext.Provider value={uiStoreRef.current}>
        {children}
      </UIStoreContext.Provider>
    </VaultStoreContext.Provider>
  );
}
