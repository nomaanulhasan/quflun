import type { VaultMeta, EntryInput, EntryListItem, VaultEntry, NoteInput } from '@/types';

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
 * Lifecycle (Task 4.1) + Entry CRUD (Task 4.2) + Notes (Task 4.3) + Organization (Task 4.4).
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

  // Secure Notes (Task 4.3)
  addNote(data: NoteInput): Promise<EntryMeta>;
  editNote(uuid: string, data: Partial<NoteInput>): Promise<EntryMeta>;

  // Organization — Categories (Task 4.4)
  // Categories are KDBX groups under the root group
  setCategory(entryUuid: string, category: string | null): Promise<void>;
  createCategory(name: string): Promise<void>;
  renameCategory(oldName: string, newName: string): Promise<void>;
  deleteCategory(name: string): Promise<void>;
  getCategories(): string[];

  // Organization — Tags (Task 4.4)
  setTags(entryUuid: string, tags: string[]): Promise<void>;
  createTag(name: string): Promise<void>;
  deleteTag(name: string): Promise<void>;
  getTags(): string[];

  // Organization — Favorites (Task 4.4)
  setFavorite(entryUuid: string, favorite: boolean): Promise<void>;

  // Import/Export (Task 14.2)
  importKdbx(file: ArrayBuffer, password: string): Promise<import('@/lib/import-export').ImportResult>;
  exportKdbx(): Promise<ArrayBuffer>;
  importCsvEntries(csvContent: string): Promise<import('@/lib/import-export').ImportResult>;
  exportCsvEntries(): Promise<string>;

  // Health Check
  runHealthCheck(): Promise<import('./health-check').HealthCheckResult>;

  // Password Health
  getPasswordHealthReport(oldPasswordDays?: number): import('./password-health').PasswordHealthReport;

  // Password management
  changePassword(currentPassword: string, newPassword: string): Promise<void>;

  /** Get current brute-force protection state */
  getBruteForceState(): BruteForceState;

  /** Check if the engine currently holds a decrypted vault */
  isUnlocked(): boolean;

  /** Get the current vault ID (null if no vault loaded) */
  getVaultId(): string | null;

  /** Set vault context (id + name) without unlocking — used after page reload
   * to tell the engine which vault to unlock. Does NOT decrypt anything. */
  setVaultContext(id: string, name: string): void;
}
