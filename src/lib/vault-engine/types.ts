import type { VaultMeta } from '@/types';

/** The possible states of the Vault Engine */
export type VaultStatus = 'locked' | 'unlocked' | 'creating' | 'opening' | 'unlocking' | 'saving';

/** Result of a vault open/create/unlock operation */
export interface VaultOperationResult {
  meta: VaultMeta;
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
 * Interface for the Vault Engine lifecycle operations (Task 4.1 only).
 * Entry CRUD, notes, categories, tags are implemented in Tasks 4.2-4.4.
 */
export interface VaultEngine {
  create(password: string, name: string): Promise<VaultMeta>;
  open(file: ArrayBuffer, password: string): Promise<VaultMeta>;
  unlock(password: string): Promise<VaultMeta>;
  lock(): void;
  save(): Promise<void>;

  /** Get current brute-force protection state */
  getBruteForceState(): BruteForceState;

  /** Check if the engine currently holds a decrypted vault */
  isUnlocked(): boolean;

  /** Get the current vault ID (null if no vault loaded) */
  getVaultId(): string | null;
}
