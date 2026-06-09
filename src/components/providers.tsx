'use client';

import { createContext, useContext, useEffect, useState } from 'react';
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

// ─── Module-Level Singletons ───────────────────────────────────────────────────
// Stores survive component remounts — prevents vault state loss on navigation.

let vaultStore: VaultStoreApi | null = null;
let uiStore: UIStoreApi | null = null;
let initialized = false;

// ─── Provider Component ────────────────────────────────────────────────────────

export function Providers({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(initialized);

  useEffect(() => {
    if (initialized) {
      setReady(true);
      return;
    }

    async function init() {
      const { getServices } = await import('@/lib/runtime');
      const { engine, storage } = await getServices();

      if (!vaultStore) {
        vaultStore = createVaultStore(engine);
      }
      if (!uiStore) {
        uiStore = createUIStore(storage);
      }

      // Hydrate vault metadata from IndexedDB — if a vault was previously
      // created/opened, set the engine's vault context so unlock() works.
      // Only metadata (id, name) is restored — NOT keys, passwords, or entries.
      const vaults = await storage.listVaults();
      if (vaults.length > 0 && !vaultStore.getState().vaultId) {
        const latest = vaults.sort((a, b) => b.lastOpened.localeCompare(a.lastOpened))[0];
        // Tell the engine which vault to unlock
        engine.setVaultContext(latest.id, latest.name);
        // Update store to show lock screen
        vaultStore.setState({
          vaultId: latest.id,
          vaultName: latest.name,
          status: 'locked',
        });
      }

      initialized = true;
      setReady(true);
    }

    init();
  }, []);

  if (!ready || !vaultStore || !uiStore) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <VaultStoreContext.Provider value={vaultStore}>
      <UIStoreContext.Provider value={uiStore}>
        {children}
      </UIStoreContext.Provider>
    </VaultStoreContext.Provider>
  );
}
