import * as kdbxweb from 'kdbxweb';
import type { VaultMeta, EntryInput, EntryListItem, VaultEntry, NoteInput } from '@/types';
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
  NOTE_BODY_MAX_LENGTH,
  MAX_TAGS_PER_ENTRY,
  TAG_MAX_LENGTH,
} from '@/lib/constants';

/** Maximum consecutive failed open attempts before requiring file re-selection */
const MAX_OPEN_ATTEMPTS = 5;

/** Timeout for decryption operations (Requirement 2.5) */
const DECRYPTION_TIMEOUT_MS = 30_000;

/** Custom data key for favorite flag (stored in entry.customData per KDBX 4.x best practices) */
const CUSTOM_KEY_FAVORITE = '_qufly_favorite';

/** Custom data key for entry type marker */
const CUSTOM_KEY_TYPE = '_qufly_type';

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

  private operationInProgress = false;

  constructor(
    private readonly cryptoAdapter: CryptoAdapter,
    private readonly storageAdapter: StorageAdapter
  ) {}

  async create(password: string, name: string): Promise<VaultMeta> {
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
    if (this.operationInProgress) {
      throw new Error('Another vault operation is already in progress.');
    }
    this.operationInProgress = true;

    try {
      this.validatePassword(password);

      if (this.bruteForce.failedOpenAttempts >= MAX_OPEN_ATTEMPTS) {
        throw new Error(
          'Too many failed attempts. Please re-select the vault file.'
        );
      }

      let db: kdbxweb.Kdbx;
      try {
        db = await withTimeout(
          this.cryptoAdapter.loadDatabase(file, password),
          DECRYPTION_TIMEOUT_MS,
          'Decryption timed out. The operation took too long.'
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);

        if (errorMessage.includes('timed out')) {
          throw err;
        }

        if (
          errorMessage.includes('BadSignature') ||
          errorMessage.includes('Not a KDBX file') ||
          errorMessage.includes('Unsupported')
        ) {
          throw new Error('The selected file is not a supported vault format.');
        }

        this.bruteForce.failedOpenAttempts++;
        if (this.bruteForce.failedOpenAttempts >= MAX_OPEN_ATTEMPTS) {
          throw new Error(
            'Too many failed attempts. Please re-select the vault file.'
          );
        }
        throw new Error('Failed to open vault file.');
      }

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
    if (this.operationInProgress) {
      throw new Error('Another vault operation is already in progress.');
    }
    this.operationInProgress = true;

    try {
      if (!this.vaultId) {
        throw new Error('No vault loaded. Cannot unlock.');
      }

      this.validatePassword(password);

      const now = Date.now();
      if (this.bruteForce.cooldownUntil > now) {
        const remainingMs = this.bruteForce.cooldownUntil - now;
        const remainingSec = Math.ceil(remainingMs / 1000);
        throw new Error(
          `Too many failed attempts. Please wait ${remainingSec} seconds before trying again.`
        );
      }

      if (this.bruteForce.failedAttempts >= MAX_UNLOCK_ATTEMPTS) {
        this.bruteForce.cooldownUntil = now + UNLOCK_COOLDOWN_SECONDS * 1000;
        const remainingSec = UNLOCK_COOLDOWN_SECONDS;
        throw new Error(
          `Too many failed attempts. Please wait ${remainingSec} seconds before trying again.`
        );
      }

      const delay = this.bruteForce.failedAttempts * 1000;
      if (delay > 0) {
        await new Promise((r) => setTimeout(r, delay));
      }

      const buffer = await this.storageAdapter.loadVault(this.vaultId);
      if (!buffer) {
        throw new Error('Vault data not found in storage.');
      }

      let db: kdbxweb.Kdbx;
      try {
        db = await withTimeout(
          this.cryptoAdapter.loadDatabase(buffer, password),
          DECRYPTION_TIMEOUT_MS,
          'Decryption timed out. The operation took too long.'
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);

        if (errorMessage.includes('timed out')) {
          throw err;
        }

        this.bruteForce.failedAttempts++;
        if (this.bruteForce.failedAttempts >= MAX_UNLOCK_ATTEMPTS) {
          this.bruteForce.cooldownUntil = Date.now() + UNLOCK_COOLDOWN_SECONDS * 1000;
        }
        throw new Error('Incorrect password.');
      }

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
    this.db = null;
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

    // Validate required fields BEFORE creating the entry
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

    // H-2 fix: Use customData for Qufly-specific metadata (KDBX 4.x best practice)
    // This keeps custom attributes invisible to other KeePass clients
    if (data.favorite) {
      this.setCustomData(entry, CUSTOM_KEY_FAVORITE, 'true');
    }

    // H-1 fix: Auto-save with rollback on failure
    try {
      await this.save();
    } catch (err) {
      // Rollback: remove the entry from in-memory db on save failure
      db.remove(entry);
      throw err;
    }

    return {
      uuid: entry.uuid.toString(),
      title: data.title,
      modifiedAt: entry.times.lastModTime?.toISOString() || new Date().toISOString(),
    };
  }

  async editEntry(uuid: string, data: Partial<EntryInput>): Promise<EntryMeta> {
    const db = this.requireUnlockedDb();

    const entry = this.findEntryByUuid(db, uuid);
    if (!entry) {
      throw new Error(`Entry not found: ${uuid}`);
    }

    // Type guard: editEntry is for password entries only (use editNote for notes)
    if (this.getCustomDataValue(entry, CUSTOM_KEY_TYPE) === 'note') {
      throw new Error('Cannot edit a secure note with editEntry. Use editNote instead.');
    }

    // Validate all fields BEFORE making any changes
    if (data.title !== undefined) {
      if (!data.title || data.title.length === 0) {
        throw new Error('Title is required.');
      }
      if (data.title.length > TITLE_MAX_LENGTH) {
        throw new Error(`Title must be at most ${TITLE_MAX_LENGTH} characters.`);
      }
    }

    // C-2 fix: Reject empty password (Requirement 4.5)
    if (data.password !== undefined) {
      if (data.password.length === 0) {
        throw new Error('Password is required.');
      }
      if (data.password.length > PASSWORD_MAX_LENGTH) {
        throw new Error(`Password must be at most ${PASSWORD_MAX_LENGTH} characters.`);
      }
    }

    if (data.username !== undefined && data.username.length > USERNAME_MAX_LENGTH) {
      throw new Error(`Username must be at most ${USERNAME_MAX_LENGTH} characters.`);
    }
    if (data.url !== undefined && data.url.length > URL_MAX_LENGTH) {
      throw new Error(`URL must be at most ${URL_MAX_LENGTH} characters.`);
    }
    if (data.notes !== undefined && data.notes.length > NOTES_MAX_LENGTH) {
      throw new Error(`Notes must be at most ${NOTES_MAX_LENGTH} characters.`);
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
    }

    // C-1 fix: Push history BEFORE modifying fields (snapshot pre-edit state)
    entry.pushHistory();

    // Now apply modifications
    if (data.title !== undefined) {
      entry.fields.set('Title', data.title);
    }
    if (data.username !== undefined) {
      entry.fields.set('UserName', data.username);
    }
    if (data.password !== undefined) {
      entry.fields.set('Password', kdbxweb.ProtectedValue.fromString(data.password));
    }
    if (data.url !== undefined) {
      entry.fields.set('URL', data.url);
    }
    if (data.notes !== undefined) {
      entry.fields.set('Notes', data.notes);
    }
    if (data.tags !== undefined) {
      entry.tags = [...data.tags];
    }
    if (data.favorite !== undefined) {
      if (data.favorite) {
        this.setCustomData(entry, CUSTOM_KEY_FAVORITE, 'true');
      } else {
        this.deleteCustomData(entry, CUSTOM_KEY_FAVORITE);
      }
    }

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

      const type = this.getCustomDataValue(entry, CUSTOM_KEY_TYPE) === 'note' ? 'note' : 'password';
      const title = this.getStringField(entry, 'Title');
      const username = this.getStringField(entry, 'UserName');
      const url = this.getStringField(entry, 'URL');
      const favorite = this.getCustomDataValue(entry, CUSTOM_KEY_FAVORITE) === 'true';
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

  // ─── Secure Notes (Task 4.3) ─────────────────────────────────────────────────

  async addNote(data: NoteInput): Promise<EntryMeta> {
    const db = this.requireUnlockedDb();

    // Validate note input
    this.validateNoteInput(data);

    // Notes are standard KDBX entries with _qufly_type="note" in customData
    const group = db.getDefaultGroup();
    const entry = db.createEntry(group);

    // Set fields: title in Title, body in Notes, Password as empty ProtectedValue
    entry.fields.set('Title', data.title);
    entry.fields.set('UserName', '');
    entry.fields.set('Password', kdbxweb.ProtectedValue.fromString(''));
    entry.fields.set('URL', '');
    entry.fields.set('Notes', data.body);

    // Tags
    if (data.tags && data.tags.length > 0) {
      entry.tags = data.tags.slice(0, MAX_TAGS_PER_ENTRY);
    }

    // Mark as note type via customData
    this.setCustomData(entry, CUSTOM_KEY_TYPE, 'note');

    // Favorite
    if (data.favorite) {
      this.setCustomData(entry, CUSTOM_KEY_FAVORITE, 'true');
    }

    // Auto-save with rollback
    try {
      await this.save();
    } catch (err) {
      db.remove(entry);
      throw err;
    }

    return {
      uuid: entry.uuid.toString(),
      title: data.title,
      modifiedAt: entry.times.lastModTime?.toISOString() || new Date().toISOString(),
    };
  }

  async editNote(uuid: string, data: Partial<NoteInput>): Promise<EntryMeta> {
    const db = this.requireUnlockedDb();

    const entry = this.findEntryByUuid(db, uuid);
    if (!entry) {
      throw new Error(`Entry not found: ${uuid}`);
    }

    // Verify this is actually a note
    if (this.getCustomDataValue(entry, CUSTOM_KEY_TYPE) !== 'note') {
      throw new Error('Entry is not a secure note.');
    }

    // Validate before modifying
    if (data.title !== undefined) {
      if (!data.title || data.title.length === 0) {
        throw new Error('Title is required.');
      }
      if (data.title.length > TITLE_MAX_LENGTH) {
        throw new Error(`Title must be at most ${TITLE_MAX_LENGTH} characters.`);
      }
    }
    if (data.body !== undefined) {
      if (!data.body || data.body.length === 0) {
        throw new Error('Body is required.');
      }
      if (data.body.length > NOTE_BODY_MAX_LENGTH) {
        throw new Error(`Body must be at most ${NOTE_BODY_MAX_LENGTH} characters.`);
      }
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
    }

    // Snapshot pre-edit state for history
    entry.pushHistory();

    // Apply modifications
    if (data.title !== undefined) {
      entry.fields.set('Title', data.title);
    }
    if (data.body !== undefined) {
      entry.fields.set('Notes', data.body);
    }
    if (data.tags !== undefined) {
      entry.tags = [...data.tags];
    }
    if (data.favorite !== undefined) {
      if (data.favorite) {
        this.setCustomData(entry, CUSTOM_KEY_FAVORITE, 'true');
      } else {
        this.deleteCustomData(entry, CUSTOM_KEY_FAVORITE);
      }
    }

    // Update modification timestamp
    entry.times.update();

    // Auto-save
    await this.save();

    return {
      uuid: entry.uuid.toString(),
      title: (entry.fields.get('Title') as string) || '',
      modifiedAt: entry.times.lastModTime?.toISOString() || new Date().toISOString(),
    };
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

  // M-1 fix: Safely extract text from a field that may be string or ProtectedValue
  private getFieldText(entry: kdbxweb.KdbxEntry, key: string): string {
    const val = entry.fields.get(key);
    if (!val) return '';
    if (typeof val === 'string') return val;
    // ProtectedValue — call getText() for full entry retrieval (getEntry only)
    return val.getText();
  }

  // H-2 fix: Custom data helpers using entry.customData (KDBX 4.x proper mechanism)
  // KdbxCustomDataMap is Map<string, { value: string | undefined; lastModified?: Date }>
  private setCustomData(entry: kdbxweb.KdbxEntry, key: string, value: string): void {
    if (!entry.customData) {
      entry.customData = new Map();
    }
    entry.customData.set(key, { value });
  }

  private deleteCustomData(entry: kdbxweb.KdbxEntry, key: string): void {
    if (entry.customData) {
      entry.customData.delete(key);
    }
  }

  private getCustomDataValue(entry: kdbxweb.KdbxEntry, key: string): string | undefined {
    return entry.customData?.get(key)?.value ?? undefined;
  }

  private mapKdbxEntryToVaultEntry(entry: kdbxweb.KdbxEntry): VaultEntry {
    const type = this.getCustomDataValue(entry, CUSTOM_KEY_TYPE) === 'note' ? 'note' as const : 'password' as const;

    // M-1 fix: Use getFieldText which handles ProtectedValue for notes correctly
    const password = this.getFieldText(entry, 'Password');
    const notes = this.getFieldText(entry, 'Notes');

    const defaultGroup = this.db!.getDefaultGroup();
    const category = entry.parentGroup?.name !== defaultGroup.name
      ? (entry.parentGroup?.name || null)
      : null;

    return {
      uuid: entry.uuid.toString(),
      type,
      title: this.getStringField(entry, 'Title'),
      username: this.getStringField(entry, 'UserName'),
      password,
      url: this.getStringField(entry, 'URL'),
      notes,
      category,
      tags: [...entry.tags],
      favorite: this.getCustomDataValue(entry, CUSTOM_KEY_FAVORITE) === 'true',
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

  private validateNoteInput(data: NoteInput): void {
    if (!data.title || data.title.length === 0) {
      throw new Error('Title is required.');
    }
    if (data.title.length > TITLE_MAX_LENGTH) {
      throw new Error(`Title must be at most ${TITLE_MAX_LENGTH} characters.`);
    }
    if (!data.body || data.body.length === 0) {
      throw new Error('Body is required.');
    }
    if (data.body.length > NOTE_BODY_MAX_LENGTH) {
      throw new Error(`Body must be at most ${NOTE_BODY_MAX_LENGTH} characters.`);
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
