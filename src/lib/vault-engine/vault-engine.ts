import type * as kdbxweb from 'kdbxweb';
import type { VaultMeta, EntryInput, EntryListItem, VaultEntry } from '@/types';
import type { CryptoAdapter } from '@/lib/crypto';
import type { StorageAdapter } from '@/lib/storage';
import type { VaultEngine, BruteForceState, EntryMeta } from './types';
import {
  MAX_UNLOCK_ATTEMPTS,
  UNLOCK_COOLDOWN_SECONDS,
  MASTER_PASSWORD_MIN_LENGTH,
  MASTER_PASSWORD_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
  URL_MAX_LENGTH,
  NOTES_MAX_LENGTH,
  MAX_TAGS_PER_ENTRY,
  TAG_MAX_LENGTH,
} from '@/lib/constants';

/** Maximum consecutive failed open attempts before requiring file re-selection */
const MAX_OPEN_ATTEMPTS = 5;

/** Timeout for decryption operations (Requirement 2.5) */
const DECRYPTION_TIMEOUT_MS = 30_000;

/**
 * Races a promise against a timeout. Rejects with a timeout error if the
 * promise doesn't settle within the given duration.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timerId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timerId));
}

class VaultEngineImpl implements VaultEngine {
  private db: kdbxweb.Kdbx | null = null;
  private vaultId: string | null = null;
  private vaultName: string | null = null;
  private bruteForce: BruteForceState = {
    failedAttempts: 0,
    cooldownUntil: 0,
    failedOpenAttempts: 0,
  };

  // C-1 fix: Mutex flag to prevent concurrent unlock/open operations
  private operationInProgress = false;

  constructor(
    private readonly cryptoAdapter: CryptoAdapter,
    private readonly storageAdapter: StorageAdapter
  ) {}

  async create(password: string, name: string): Promise<VaultMeta> {
    // M-2 fix: Validate password length
    this.validatePassword(password);

    const id = crypto.randomUUID();
    const db = await this.cryptoAdapter.createDatabase(password, name);
    const buffer = await this.cryptoAdapter.saveDatabase(db);
    await this.storageAdapter.saveVault(id, name, buffer);

    this.db = db;
    this.vaultId = id;
    this.vaultName = name;

    return {
      id,
      name,
      lastOpened: new Date().toISOString(),
    };
  }

  async open(file: ArrayBuffer, password: string): Promise<VaultMeta> {
    // C-1 fix: Prevent concurrent operations
    if (this.operationInProgress) {
      throw new Error('Another vault operation is already in progress.');
    }
    this.operationInProgress = true;

    try {
      // M-2 fix: Validate password length
      this.validatePassword(password);

      // Check brute-force state for open attempts
      if (this.bruteForce.failedOpenAttempts >= MAX_OPEN_ATTEMPTS) {
        throw new Error(
          'Too many failed attempts. Please re-select the vault file.'
        );
      }

      let db: kdbxweb.Kdbx;
      try {
        // H-3 fix: Apply 30-second timeout (Requirement 2.5)
        db = await withTimeout(
          this.cryptoAdapter.loadDatabase(file, password),
          DECRYPTION_TIMEOUT_MS,
          'Decryption timed out. The operation took too long.'
        );
      } catch (err) {
        // H-2 fix: Distinguish error types
        const errorMessage = err instanceof Error ? err.message : String(err);

        // Timeout error — don't count toward brute-force
        if (errorMessage.includes('timed out')) {
          throw err;
        }

        // Check for invalid file format (kdbxweb throws BadSignature)
        if (
          errorMessage.includes('BadSignature') ||
          errorMessage.includes('Not a KDBX file') ||
          errorMessage.includes('Unsupported')
        ) {
          // Requirement 2.4/2.6: Separate error for invalid/corrupted files
          // Do NOT increment failedOpenAttempts — this isn't a password failure
          throw new Error('The selected file is not a supported vault format.');
        }

        // Authentication failure or other decryption error
        this.bruteForce.failedOpenAttempts++;
        if (this.bruteForce.failedOpenAttempts >= MAX_OPEN_ATTEMPTS) {
          throw new Error(
            'Too many failed attempts. Please re-select the vault file.'
          );
        }
        // C-2 fix: Generic message that doesn't reveal whether password or file is the issue
        // (Requirement 2.3: "without revealing whether the password or the file is invalid")
        throw new Error('Failed to open vault file.');
      }

      // Success — reset failed open attempts
      this.bruteForce.failedOpenAttempts = 0;

      const id = crypto.randomUUID();
      const name = db.meta.name || 'Unnamed Vault';
      const buffer = await this.cryptoAdapter.saveDatabase(db);
      await this.storageAdapter.saveVault(id, name, buffer);

      this.db = db;
      this.vaultId = id;
      this.vaultName = name;

      return {
        id,
        name,
        lastOpened: new Date().toISOString(),
      };
    } finally {
      this.operationInProgress = false;
    }
  }

  async unlock(password: string): Promise<VaultMeta> {
    // C-1 fix: Prevent concurrent unlock operations
    if (this.operationInProgress) {
      throw new Error('Another vault operation is already in progress.');
    }
    this.operationInProgress = true;

    try {
      if (!this.vaultId) {
        throw new Error('No vault loaded. Cannot unlock.');
      }

      // M-2 fix: Validate password length
      this.validatePassword(password);

      // Check cooldown
      const now = Date.now();
      if (this.bruteForce.cooldownUntil > now) {
        const remainingMs = this.bruteForce.cooldownUntil - now;
        const remainingSec = Math.ceil(remainingMs / 1000);
        throw new Error(
          `Too many failed attempts. Please wait ${remainingSec} seconds before trying again.`
        );
      }

      // Check if we've hit max attempts — start cooldown
      if (this.bruteForce.failedAttempts >= MAX_UNLOCK_ATTEMPTS) {
        this.bruteForce.cooldownUntil = now + UNLOCK_COOLDOWN_SECONDS * 1000;
        const remainingSec = UNLOCK_COOLDOWN_SECONDS;
        throw new Error(
          `Too many failed attempts. Please wait ${remainingSec} seconds before trying again.`
        );
      }

      // Incremental delay: failedAttempts * 1000ms (Requirement 3.5)
      const delay = this.bruteForce.failedAttempts * 1000;
      if (delay > 0) {
        await new Promise((r) => setTimeout(r, delay));
      }

      // Load encrypted vault from storage
      const buffer = await this.storageAdapter.loadVault(this.vaultId);
      if (!buffer) {
        throw new Error('Vault data not found in storage.');
      }

      let db: kdbxweb.Kdbx;
      try {
        // H-3 fix: Apply 30-second timeout (Requirement 2.5 applies to unlock too)
        db = await withTimeout(
          this.cryptoAdapter.loadDatabase(buffer, password),
          DECRYPTION_TIMEOUT_MS,
          'Decryption timed out. The operation took too long.'
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);

        // Timeout — don't increment failure counter
        if (errorMessage.includes('timed out')) {
          throw err;
        }

        this.bruteForce.failedAttempts++;
        // If hits max, start cooldown
        if (this.bruteForce.failedAttempts >= MAX_UNLOCK_ATTEMPTS) {
          this.bruteForce.cooldownUntil = Date.now() + UNLOCK_COOLDOWN_SECONDS * 1000;
        }
        throw new Error('Incorrect password.');
      }

      // Success — reset brute-force state
      this.bruteForce.failedAttempts = 0;
      this.bruteForce.cooldownUntil = 0;
      this.db = db;

      return {
        id: this.vaultId,
        name: this.vaultName || 'Unnamed Vault',
        lastOpened: new Date().toISOString(),
      };
    } finally {
      this.operationInProgress = false;
    }
  }

  lock(): void {
    // Release the decrypted database for GC (Requirement 15.6)
    this.db = null;
    // Do NOT clear vaultId/vaultName — needed for unlock
  }

  async save(): Promise<void> {
    if (!this.db) {
      throw new Error('No decrypted vault to save.');
    }
    if (!this.vaultId) {
      throw new Error('No vault ID. Cannot save.');
    }

    const buffer = await this.cryptoAdapter.saveDatabase(this.db);
    await this.storageAdapter.saveVault(
      this.vaultId,
      this.vaultName || 'Unnamed Vault',
      buffer
    );
  }

  // ─── Entry CRUD (Task 4.2) ─────────────────────────────────────────────────

  async addEntry(data: EntryInput): Promise<EntryMeta> {
    const db = this.requireUnlockedDb();
    const kdbxweb = await import('kdbxweb');

    // Validate required fields
    this.validateEntryInput(data);

    // Create entry in the default group (category assignment is Task 4.4)
    const group = db.getDefaultGroup();
    const entry = db.createEntry(group);

    // Set fields per KDBX mapping (design document)
    entry.fields.set('Title', data.title);
    entry.fields.set('UserName', data.username || '');
    entry.fields.set('Password', kdbxweb.ProtectedValue.fromString(data.password));
    entry.fields.set('URL', data.url || '');
    entry.fields.set('Notes', data.notes || '');

    // Tags: stored as string[] on KdbxEntry.tags (native KDBX 4.x)
    if (data.tags && data.tags.length > 0) {
      entry.tags = data.tags.slice(0, MAX_TAGS_PER_ENTRY);
    }

    // Favorite: custom attribute (design document)
    if (data.favorite) {
      entry.fields.set('_qufly_favorite', 'true');
    }

    // Type marker for password entries (notes use _qufly_type="note" in Task 4.3)
    // Password entries do NOT set _qufly_type — absence means "password"

    // Times: kdbxweb sets creationTime automatically via createEntry
    entry.times.update();

    // Auto-save
    await this.save();

    return {
      uuid: entry.uuid.toString(),
      title: data.title,
      modifiedAt: entry.times.lastModTime?.toISOString() || new Date().toISOString(),
    };
  }

  async editEntry(uuid: string, data: Partial<EntryInput>): Promise<EntryMeta> {
    const db = this.requireUnlockedDb();
    const kdbxweb = await import('kdbxweb');

    const entry = this.findEntryByUuid(db, uuid);
    if (!entry) {
      throw new Error(`Entry not found: ${uuid}`);
    }

    // Validate: title cannot be removed (Requirement 5.3)
    if (data.title !== undefined) {
      if (!data.title || data.title.length === 0) {
        throw new Error('Title is required.');
      }
      if (data.title.length > TITLE_MAX_LENGTH) {
        throw new Error(`Title must be at most ${TITLE_MAX_LENGTH} characters.`);
      }
      entry.fields.set('Title', data.title);
    }

    if (data.username !== undefined) {
      if (data.username.length > USERNAME_MAX_LENGTH) {
        throw new Error(`Username must be at most ${USERNAME_MAX_LENGTH} characters.`);
      }
      entry.fields.set('UserName', data.username);
    }

    if (data.password !== undefined) {
      if (data.password.length > PASSWORD_MAX_LENGTH) {
        throw new Error(`Password must be at most ${PASSWORD_MAX_LENGTH} characters.`);
      }
      entry.fields.set('Password', kdbxweb.ProtectedValue.fromString(data.password));
    }

    if (data.url !== undefined) {
      if (data.url.length > URL_MAX_LENGTH) {
        throw new Error(`URL must be at most ${URL_MAX_LENGTH} characters.`);
      }
      entry.fields.set('URL', data.url);
    }

    if (data.notes !== undefined) {
      if (data.notes.length > NOTES_MAX_LENGTH) {
        throw new Error(`Notes must be at most ${NOTES_MAX_LENGTH} characters.`);
      }
      entry.fields.set('Notes', data.notes);
    }

    if (data.tags !== undefined) {
      if (data.tags.length > MAX_TAGS_PER_ENTRY) {
        throw new Error(`Maximum ${MAX_TAGS_PER_ENTRY} tags allowed.`);
      }
      for (const tag of data.tags) {
        if (tag.length > TAG_MAX_LENGTH) {
          throw new Error(`Each tag must be at most ${TAG_MAX_LENGTH} characters.`);
        }
      }
      entry.tags = [...data.tags];
    }

    if (data.favorite !== undefined) {
      if (data.favorite) {
        entry.fields.set('_qufly_favorite', 'true');
      } else {
        entry.fields.delete('_qufly_favorite');
      }
    }

    // Push history state before modification (for merge support)
    entry.pushHistory();
    // Update modification timestamp (Requirement 5.2)
    entry.times.update();

    // Auto-save
    await this.save();

    return {
      uuid: entry.uuid.toString(),
      title: (entry.fields.get('Title') as string) || '',
      modifiedAt: entry.times.lastModTime?.toISOString() || new Date().toISOString(),
    };
  }

  async deleteEntry(uuid: string): Promise<void> {
    const db = this.requireUnlockedDb();

    const entry = this.findEntryByUuid(db, uuid);
    if (!entry) {
      throw new Error(`Entry not found: ${uuid}`);
    }

    // Use db.remove which handles recycle bin logic
    db.remove(entry);

    // Auto-save
    await this.save();
  }

  getEntry(uuid: string): VaultEntry {
    const db = this.requireUnlockedDb();

    const entry = this.findEntryByUuid(db, uuid);
    if (!entry) {
      throw new Error(`Entry not found: ${uuid}`);
    }

    return this.mapKdbxEntryToVaultEntry(entry);
  }

  listEntries(): EntryListItem[] {
    const db = this.requireUnlockedDb();
    const defaultGroup = db.getDefaultGroup();
    const recycleBinUuid = db.meta.recycleBinUuid;
    const items: EntryListItem[] = [];

    for (const entry of defaultGroup.allEntries()) {
      // Skip entries in the recycle bin
      if (recycleBinUuid && entry.parentGroup?.uuid.equals(recycleBinUuid)) {
        continue;
      }

      const type = entry.fields.get('_qufly_type') === 'note' ? 'note' : 'password';
      const title = this.getStringField(entry, 'Title');
      const username = this.getStringField(entry, 'UserName');
      const url = this.getStringField(entry, 'URL');
      const favorite = entry.fields.get('_qufly_favorite') === 'true';
      const category = entry.parentGroup?.name !== defaultGroup.name
        ? (entry.parentGroup?.name || null)
        : null;

      items.push({
        uuid: entry.uuid.toString(),
        type,
        title,
        username,
        url,
        category,
        tags: [...entry.tags],
        favorite,
        modifiedAt: entry.times.lastModTime?.toISOString() || '',
      });
    }

    return items;
  }

  // ─── Helper Methods ────────────────────────────────────────────────────────

  private requireUnlockedDb(): kdbxweb.Kdbx {
    if (!this.db) {
      throw new Error('Vault is locked. Cannot access entries.');
    }
    return this.db;
  }

  private findEntryByUuid(db: kdbxweb.Kdbx, uuid: string): kdbxweb.KdbxEntry | undefined {
    const defaultGroup = db.getDefaultGroup();
    const recycleBinUuid = db.meta.recycleBinUuid;

    for (const entry of defaultGroup.allEntries()) {
      // Skip entries in the recycle bin
      if (recycleBinUuid && entry.parentGroup?.uuid.equals(recycleBinUuid)) {
        continue;
      }
      if (entry.uuid.toString() === uuid) {
        return entry;
      }
    }
    return undefined;
  }

  private getStringField(entry: kdbxweb.KdbxEntry, key: string): string {
    const val = entry.fields.get(key);
    if (!val) return '';
    if (typeof val === 'string') return val;
    // ProtectedValue — do NOT call getText() for list views (security)
    return '';
  }

  private mapKdbxEntryToVaultEntry(entry: kdbxweb.KdbxEntry): VaultEntry {
    const type = entry.fields.get('_qufly_type') === 'note' ? 'note' as const : 'password' as const;
    const passwordField = entry.fields.get('Password');
    // Only expose password via getText() in getEntry (on-demand, per design)
    const password = passwordField && typeof passwordField !== 'string'
      ? passwordField.getText()
      : (typeof passwordField === 'string' ? passwordField : '');

    const defaultGroup = this.db?.getDefaultGroup();
    const category = entry.parentGroup?.name !== defaultGroup?.name
      ? (entry.parentGroup?.name || null)
      : null;

    return {
      uuid: entry.uuid.toString(),
      type,
      title: this.getStringField(entry, 'Title'),
      username: this.getStringField(entry, 'UserName'),
      password,
      url: this.getStringField(entry, 'URL'),
      notes: this.getStringField(entry, 'Notes'),
      category,
      tags: [...entry.tags],
      favorite: entry.fields.get('_qufly_favorite') === 'true',
      createdAt: entry.times.creationTime?.toISOString() || '',
      modifiedAt: entry.times.lastModTime?.toISOString() || '',
    };
  }

  private validateEntryInput(data: EntryInput): void {
    if (!data.title || data.title.length === 0) {
      throw new Error('Title is required.');
    }
    if (data.title.length > TITLE_MAX_LENGTH) {
      throw new Error(`Title must be at most ${TITLE_MAX_LENGTH} characters.`);
    }
    if (!data.password || data.password.length === 0) {
      throw new Error('Password is required.');
    }
    if (data.password.length > PASSWORD_MAX_LENGTH) {
      throw new Error(`Password must be at most ${PASSWORD_MAX_LENGTH} characters.`);
    }
    if (data.username && data.username.length > USERNAME_MAX_LENGTH) {
      throw new Error(`Username must be at most ${USERNAME_MAX_LENGTH} characters.`);
    }
    if (data.url && data.url.length > URL_MAX_LENGTH) {
      throw new Error(`URL must be at most ${URL_MAX_LENGTH} characters.`);
    }
    if (data.notes && data.notes.length > NOTES_MAX_LENGTH) {
      throw new Error(`Notes must be at most ${NOTES_MAX_LENGTH} characters.`);
    }
    if (data.tags) {
      if (data.tags.length > MAX_TAGS_PER_ENTRY) {
        throw new Error(`Maximum ${MAX_TAGS_PER_ENTRY} tags allowed.`);
      }
      for (const tag of data.tags) {
        if (tag.length > TAG_MAX_LENGTH) {
          throw new Error(`Each tag must be at most ${TAG_MAX_LENGTH} characters.`);
        }
      }
    }
  }

  getBruteForceState(): BruteForceState {
    return { ...this.bruteForce };
  }

  isUnlocked(): boolean {
    return this.db !== null;
  }

  getVaultId(): string | null {
    return this.vaultId;
  }

  // M-2 fix: Password validation helper
  private validatePassword(password: string): void {
    if (
      password.length < MASTER_PASSWORD_MIN_LENGTH ||
      password.length > MASTER_PASSWORD_MAX_LENGTH
    ) {
      throw new Error(
        `Password must be between ${MASTER_PASSWORD_MIN_LENGTH} and ${MASTER_PASSWORD_MAX_LENGTH} characters.`
      );
    }
  }
}

/**
 * Factory function to create a VaultEngine instance.
 * Not a singleton — the engine is stateful per-vault.
 */
export function createVaultEngine(
  crypto: CryptoAdapter,
  storage: StorageAdapter
): VaultEngine {
  return new VaultEngineImpl(crypto, storage);
}
