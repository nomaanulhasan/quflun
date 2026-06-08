import type { VaultMeta, EntryInput, EntryListItem, VaultEntry } from '@/types';

/** The possible states of the Vault Engine */
export type VaultStatus = 'locked' | 'unlocked' | 'creating' | 'opening' | 'unlocking' | 'saving';

/** Result of a vault open/create/unlock operation */
export interface VaultOperationResult {
  meta: VaultMeta;
}

/** Metadata returned after entry creation or modification */
export interface EntryMeta {
  uuid: string;
  title: string;
  modifiedAt: string;
}

/** Brute-force protection state */
export interface BruteForceState {
  /** Number of consecutive failed unlock attempts */
  failedAttempts: number;
  /** Timestamp when cooldown expires (0 if not in cooldown) */
  cooldownUntil: number;
  /** Number of consecutive failed open attempts */
  failedOpenAttempts: number;
}

/**
 * Interface for the Vault Engine operations.
 * Lifecycle (Task 4.1) + Entry CRUD (Task 4.2).
 * Notes, categories, tags are implemented in Tasks 4.3-4.4.
 */
export interface VaultEngine {
  // Lifecycle (Task 4.1)
  create(password: string, name: string): Promise<VaultMeta>;
  open(file: ArrayBuffer, password: string): Promise<VaultMeta>;
  unlock(password: string): Promise<VaultMeta>;
  lock(): void;
  save(): Promise<void>;

  // Entry CRUD (Task 4.2)
  addEntry(data: EntryInput): Promise<EntryMeta>;
  editEntry(uuid: string, data: Partial<EntryInput>): Promise<EntryMeta>;
  deleteEntry(uuid: string): Promise<void>;
  getEntry(uuid: string): VaultEntry;
  listEntries(): EntryListItem[];

  /** Get current brute-force protection state */
  getBruteForceState(): BruteForceState;

  /** Check if the engine currently holds a decrypted vault */
  isUnlocked(): boolean;

  /** Get the current vault ID (null if no vault loaded) */
  getVaultId(): string | null;
}
