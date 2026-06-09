'use client';

import { useCallback, useState } from 'react';
import type { VaultState } from '@/stores/vault-store';

/**
 * useVault — wraps Vault Store with loading/error state for UI.
 *
 * Does not duplicate business logic.
 * VaultEngine (via the store) remains the source of truth.
 *
 * @param useStore - The Zustand vault store hook
 */
export function useVault(useStore: () => VaultState) {
  const store = useStore();
  const [loading, setLoading] = useState(false);

  const withLoading = useCallback(
    <T>(fn: () => Promise<T>) =>
      async (): Promise<T> => {
        setLoading(true);
        try {
          return await fn();
        } finally {
          setLoading(false);
        }
      },
    []
  );

  return {
    // State
    status: store.status,
    entries: store.entries,
    vaultId: store.vaultId,
    vaultName: store.vaultName,
    error: store.error,
    loading,
    isUnlocked: store.status === 'unlocked',
    isLocked: store.status === 'locked',

    // Actions (wrapped with loading state)
    create: (password: string, name: string) =>
      withLoading(() => store.create(password, name))(),
    open: (file: ArrayBuffer, password: string) =>
      withLoading(() => store.open(file, password))(),
    unlock: (password: string) =>
      withLoading(() => store.unlock(password))(),
    lock: store.lock,

    // Entry CRUD
    addEntry: store.addEntry,
    editEntry: store.editEntry,
    deleteEntry: store.deleteEntry,
    addNote: store.addNote,
    editNote: store.editNote,

    // Organization
    setCategory: store.setCategory,
    setTags: store.setTags,
    setFavorite: store.setFavorite,
    createCategory: store.createCategory,
    renameCategory: store.renameCategory,
    deleteCategory: store.deleteCategory,
    createTag: store.createTag,
    deleteTag: store.deleteTag,

    // Brute-force
    getBruteForceState: store.getBruteForceState,
  };
}
