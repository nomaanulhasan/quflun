/**
 * Vault Store — Zustand store for vault state.
 *
 * CRITICAL CONSTRAINTS:
 * - NO persist middleware
 * - NO localStorage / sessionStorage
 * - All decrypted state is transient (memory-only)
 * - Lock clears all entries and references
 *
 * This store is a projection of VaultEngine state.
 * VaultEngine remains the source of truth for KDBX operations.
 * The store provides reactive UI bindings.
 */
import { create } from 'zustand';
import type { EntryInput, EntryListItem, NoteInput, PinInput, VaultMeta } from '@/types';
import type { VaultEngine, EntryMeta, BruteForceState } from '@/lib/vault-engine';

// ─── State Types ───────────────────────────────────────────────────────────────

export type VaultStatus = 'locked' | 'unlocked' | 'unlocking' | 'saving' | 'creating' | 'opening';

export interface VaultState {
  // State
  status: VaultStatus;
  entries: EntryListItem[];
  vaultId: string | null;
  vaultName: string | null;
  error: string | null;

  // Actions — lifecycle
  create: (password: string, name: string) => Promise<VaultMeta>;
  open: (file: ArrayBuffer, password: string) => Promise<VaultMeta>;
  unlock: (password: string) => Promise<VaultMeta>;
  lock: () => void;

  // Actions — entry CRUD
  addEntry: (data: EntryInput) => Promise<EntryMeta>;
  editEntry: (uuid: string, data: Partial<EntryInput>) => Promise<EntryMeta>;
  deleteEntry: (uuid: string) => Promise<void>;

  // Actions — notes
  addNote: (data: NoteInput) => Promise<EntryMeta>;
  editNote: (uuid: string, data: Partial<NoteInput>) => Promise<EntryMeta>;

  // Actions — PINs
  addPin: (data: PinInput) => Promise<EntryMeta>;
  editPin: (uuid: string, data: Partial<PinInput>) => Promise<EntryMeta>;

  // Actions — organization
  setCategory: (entryUuid: string, category: string | null) => Promise<void>;
  setTags: (entryUuid: string, tags: string[]) => Promise<void>;
  setFavorite: (entryUuid: string, favorite: boolean) => Promise<void>;
  createCategory: (name: string) => Promise<void>;
  renameCategory: (oldName: string, newName: string) => Promise<void>;
  deleteCategory: (name: string) => Promise<void>;
  createTag: (name: string) => Promise<void>;
  deleteTag: (name: string) => Promise<void>;

  // Actions — password management
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;

  // Getters
  getBruteForceState: () => BruteForceState;
}

// ─── Store Factory ─────────────────────────────────────────────────────────────

/**
 * Creates the vault store wired to a VaultEngine instance.
 * The engine must be created externally (with crypto + storage adapters).
 */
export function createVaultStore(engine: VaultEngine) {
  return create<VaultState>((set) => {
    // Helper: refresh entry list from engine
    function refreshEntries() {
      set({ entries: engine.listEntries() });
    }

    return {
      // ─── Initial state (locked, no data) ───────────────────────────────
      status: 'locked',
      entries: [],
      vaultId: null,
      vaultName: null,
      error: null,

      // ─── Lifecycle ─────────────────────────────────────────────────────

      async create(password: string, name: string) {
        set({ status: 'creating', error: null });
        try {
          const meta = await engine.create(password, name);
          set({
            status: 'unlocked',
            vaultId: meta.id,
            vaultName: meta.name,
            entries: engine.listEntries(),
          });
          return meta;
        } catch (err) {
          set({ status: 'locked', error: (err as Error).message });
          throw err;
        }
      },

      async open(file: ArrayBuffer, password: string) {
        set({ status: 'opening', error: null });
        try {
          const meta = await engine.open(file, password);
          set({
            status: 'unlocked',
            vaultId: meta.id,
            vaultName: meta.name,
            entries: engine.listEntries(),
          });
          return meta;
        } catch (err) {
          set({ status: 'locked', error: (err as Error).message });
          throw err;
        }
      },

      async unlock(password: string) {
        set({ status: 'unlocking', error: null });
        try {
          const meta = await engine.unlock(password);
          set({
            status: 'unlocked',
            vaultId: meta.id,
            vaultName: meta.name,
            entries: engine.listEntries(),
          });
          return meta;
        } catch (err) {
          set({ status: 'locked', error: (err as Error).message });
          throw err;
        }
      },

      lock() {
        engine.lock();
        // Clear all transient state (Requirement 15.6)
        set({
          status: 'locked',
          entries: [],
          error: null,
        });
        // vaultId/vaultName preserved for unlock (engine needs them)
      },

      // ─── Entry CRUD ────────────────────────────────────────────────────

      async addEntry(data: EntryInput) {
        const meta = await engine.addEntry(data);
        refreshEntries();
        return meta;
      },

      async editEntry(uuid: string, data: Partial<EntryInput>) {
        const meta = await engine.editEntry(uuid, data);
        refreshEntries();
        return meta;
      },

      async deleteEntry(uuid: string) {
        await engine.deleteEntry(uuid);
        refreshEntries();
      },

      // ─── Notes ─────────────────────────────────────────────────────────

      async addNote(data: NoteInput) {
        const meta = await engine.addNote(data);
        refreshEntries();
        return meta;
      },

      async editNote(uuid: string, data: Partial<NoteInput>) {
        const meta = await engine.editNote(uuid, data);
        refreshEntries();
        return meta;
      },

      // ─── PINs ──────────────────────────────────────────────────────────

      async addPin(data: PinInput) {
        const meta = await engine.addPin(data);
        refreshEntries();
        return meta;
      },

      async editPin(uuid: string, data: Partial<PinInput>) {
        const meta = await engine.editPin(uuid, data);
        refreshEntries();
        return meta;
      },

      // ─── Organization ──────────────────────────────────────────────────

      async setCategory(entryUuid: string, category: string | null) {
        await engine.setCategory(entryUuid, category);
        refreshEntries();
      },

      async setTags(entryUuid: string, tags: string[]) {
        await engine.setTags(entryUuid, tags);
        refreshEntries();
      },

      async setFavorite(entryUuid: string, favorite: boolean) {
        await engine.setFavorite(entryUuid, favorite);
        refreshEntries();
      },

      async createCategory(name: string) {
        await engine.createCategory(name);
      },

      async renameCategory(oldName: string, newName: string) {
        await engine.renameCategory(oldName, newName);
        refreshEntries();
      },

      async deleteCategory(name: string) {
        await engine.deleteCategory(name);
        refreshEntries();
      },

      async createTag(name: string) {
        await engine.createTag(name);
      },

      async deleteTag(name: string) {
        await engine.deleteTag(name);
        refreshEntries();
      },

      // ─── Password Management ─────────────────────────────────────────────

      async changePassword(currentPassword: string, newPassword: string) {
        set({ error: null });
        try {
          await engine.changePassword(currentPassword, newPassword);
        } catch (err) {
          set({ error: (err as Error).message });
          throw err;
        }
      },

      // ─── Getters ───────────────────────────────────────────────────────

      getBruteForceState() {
        return engine.getBruteForceState();
      },
    };
  });
}
