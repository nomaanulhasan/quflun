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
  MAX_CATEGORIES,
  MAX_TAGS,
  CATEGORY_NAME_MAX_LENGTH,
} from '@/lib/constants';

/** Maximum consecutive failed open attempts before requiring file re-selection */
const MAX_OPEN_ATTEMPTS = 5;

/** Timeout for decryption operations (Requirement 2.5) */
const DECRYPTION_TIMEOUT_MS = 30_000;

/** Custom data key for favorite flag (stored in entry.customData per KDBX 4.x best practices) */
const CUSTOM_KEY_FAVORITE = '_quflun_favorite';

/** Custom data key for entry type marker */
const CUSTOM_KEY_TYPE = '_quflun_type';

/** Custom data key for tag registry (stored on the root group's customData) */
const CUSTOM_KEY_TAG_REGISTRY = '_quflun_tags';

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
        throw new Error('Too many failed attempts. Please re-select the vault file.');
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
          throw new Error('Too many failed attempts. Please re-select the vault file.');
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
    await this.storageAdapter.saveVault(this.vaultId, this.vaultName || 'Unnamed Vault', buffer);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (this.operationInProgress) {
      throw new Error('Another vault operation is already in progress.');
    }
    this.operationInProgress = true;

    try {
      if (!this.db) {
        throw new Error('Vault must be unlocked to change password.');
      }
      if (!this.vaultId) {
        throw new Error('No vault ID. Cannot change password.');
      }

      // Validate new password
      this.validatePassword(newPassword);

      // ── Step 1: Load the existing encrypted blob (serves as our backup) ──
      const existingBuffer = await this.storageAdapter.loadVault(this.vaultId);
      if (!existingBuffer) {
        throw new Error('Vault data not found in storage.');
      }

      // ── Step 2: Verify current password is correct ──
      try {
        await withTimeout(
          this.cryptoAdapter.loadDatabase(existingBuffer, currentPassword),
          DECRYPTION_TIMEOUT_MS,
          'Password verification timed out.'
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage.includes('timed out')) {
          throw err;
        }
        throw new Error('Current password is incorrect.');
      }

      // ── Step 3: Update credentials and re-encrypt ──
      // Save old credentials for rollback
      const oldCredentials = this.db.credentials;

      this.db.credentials = new kdbxweb.Credentials(kdbxweb.ProtectedValue.fromString(newPassword));

      let newBuffer: ArrayBuffer;
      try {
        newBuffer = await this.cryptoAdapter.saveDatabase(this.db);
      } catch {
        // Rollback credentials on encryption failure
        this.db.credentials = oldCredentials;
        throw new Error('Failed to re-encrypt vault with new password.');
      }

      // ── Step 4: Verify the new blob is valid by test-decrypting it ──
      try {
        await withTimeout(
          this.cryptoAdapter.loadDatabase(newBuffer, newPassword),
          DECRYPTION_TIMEOUT_MS,
          'Verification of re-encrypted vault timed out.'
        );
      } catch {
        // New blob is corrupt — rollback credentials, do NOT persist
        this.db.credentials = oldCredentials;
        throw new Error('Integrity check failed. Password was not changed.');
      }

      // ── Step 5: Persist the verified new blob ──
      try {
        await this.storageAdapter.saveVault(
          this.vaultId,
          this.vaultName || 'Unnamed Vault',
          newBuffer
        );
      } catch {
        // Storage write failed — rollback credentials
        // The old blob in IndexedDB remains intact
        this.db.credentials = oldCredentials;
        throw new Error('Failed to save vault. Password was not changed.');
      }

      // Success — vault is now encrypted with the new password
    } finally {
      this.operationInProgress = false;
    }
  }

  // ─── Custom Fields & Attachments ─────────────────────────────────────────────

  async setCustomFields(entryUuid: string, fields: import('@/types').CustomField[]): Promise<void> {
    const db = this.requireUnlockedDb();
    const entry = this.findEntryByUuid(db, entryUuid);
    if (!entry) throw new Error(`Entry not found: ${entryUuid}`);

    // Remove existing custom fields
    const standardFields = new Set(['Title', 'UserName', 'Password', 'URL', 'Notes']);
    for (const key of [...entry.fields.keys()]) {
      if (!standardFields.has(key)) {
        entry.fields.delete(key);
      }
    }

    // Set new ones
    for (const field of fields) {
      if (field.protected) {
        entry.fields.set(field.key, kdbxweb.ProtectedValue.fromString(field.value));
      } else {
        entry.fields.set(field.key, field.value);
      }
    }

    entry.times.update();
    await this.save();
  }

  async addAttachment(entryUuid: string, filename: string, data: ArrayBuffer): Promise<void> {
    const db = this.requireUnlockedDb();
    const entry = this.findEntryByUuid(db, entryUuid);
    if (!entry) throw new Error(`Entry not found: ${entryUuid}`);

    // Size limit: 10 MB per attachment
    if (data.byteLength > 10 * 1024 * 1024) {
      throw new Error('Attachment exceeds 10 MB size limit.');
    }

    // Store in KDBX binary pool
    const binaryWithHash = await db.createBinary(data);
    entry.binaries.set(filename, binaryWithHash);
    entry.times.update();
    await this.save();
  }

  async removeAttachment(entryUuid: string, filename: string): Promise<void> {
    const db = this.requireUnlockedDb();
    const entry = this.findEntryByUuid(db, entryUuid);
    if (!entry) throw new Error(`Entry not found: ${entryUuid}`);

    if (!entry.binaries.has(filename)) {
      throw new Error(`Attachment not found: ${filename}`);
    }

    entry.binaries.delete(filename);
    entry.times.update();
    await this.save();
  }

  getAttachment(entryUuid: string, filename: string): ArrayBuffer {
    const db = this.requireUnlockedDb();
    const entry = this.findEntryByUuid(db, entryUuid);
    if (!entry) throw new Error(`Entry not found: ${entryUuid}`);

    if (!entry.binaries.has(filename)) {
      throw new Error(`Attachment not found: ${filename}`);
    }

    const bin = entry.binaries.get(filename)!;

    // KdbxBinaryWithHash has { hash, value } — value is KdbxBinary (ArrayBuffer | ProtectedValue)
    // KdbxBinary is ArrayBuffer | ProtectedValue
    const value = kdbxweb.KdbxBinaries.isKdbxBinaryWithHash(bin) ? bin.value : bin;

    if (value instanceof ArrayBuffer) return value;
    // ProtectedValue — get the underlying bytes
    if (value && typeof (value as kdbxweb.ProtectedValue).getBinary === 'function') {
      const bytes = (value as kdbxweb.ProtectedValue).getBinary();
      return new Uint8Array(bytes).buffer as ArrayBuffer;
    }
    throw new Error(`Could not read attachment: ${filename}`);
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

    // H-2 fix: Use customData for Quflun-specific metadata (KDBX 4.x best practice)
    // This keeps custom attributes invisible to other KeePass clients
    if (data.favorite) {
      this.setCustomData(entry, CUSTOM_KEY_FAVORITE, 'true');
    }

    // Custom fields
    if (data.customFields && data.customFields.length > 0) {
      for (const field of data.customFields) {
        if (field.protected) {
          entry.fields.set(field.key, kdbxweb.ProtectedValue.fromString(field.value));
        } else {
          entry.fields.set(field.key, field.value);
        }
      }
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
    if (data.customFields !== undefined) {
      // Remove existing custom fields (keep standard fields)
      const standardFields = new Set(['Title', 'UserName', 'Password', 'URL', 'Notes']);
      for (const key of [...entry.fields.keys()]) {
        if (!standardFields.has(key)) {
          entry.fields.delete(key);
        }
      }
      // Set new custom fields
      for (const field of data.customFields) {
        if (field.protected) {
          entry.fields.set(field.key, kdbxweb.ProtectedValue.fromString(field.value));
        } else {
          entry.fields.set(field.key, field.value);
        }
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
      const category =
        entry.parentGroup?.name !== defaultGroup.name ? entry.parentGroup?.name || null : null;

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
        passwordStrength: type === 'password' ? this.computePasswordStrength(entry) : null,
      });
    }

    return items;
  }

  // ─── Secure Notes (Task 4.3) ─────────────────────────────────────────────────

  async addNote(data: NoteInput): Promise<EntryMeta> {
    const db = this.requireUnlockedDb();

    // Validate note input
    this.validateNoteInput(data);

    // Notes are standard KDBX entries with _quflun_type="note" in customData
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

  // ─── Organization — Categories, Tags, Favorites (Task 4.4) ──────────────────

  async setCategory(entryUuid: string, category: string | null): Promise<void> {
    const db = this.requireUnlockedDb();
    const entry = this.findEntryByUuid(db, entryUuid);
    if (!entry) {
      throw new Error(`Entry not found: ${entryUuid}`);
    }

    const defaultGroup = db.getDefaultGroup();

    if (category === null) {
      // Move to root (uncategorized)
      db.move(entry, defaultGroup);
    } else {
      // Find or error if group doesn't exist
      const targetGroup = this.findGroupByName(db, category);
      if (!targetGroup) {
        throw new Error(`Category not found: ${category}`);
      }
      db.move(entry, targetGroup);
    }

    await this.save();
  }

  async createCategory(name: string): Promise<void> {
    const db = this.requireUnlockedDb();

    if (!name || name.length === 0) {
      throw new Error('Category name is required.');
    }
    if (name.length > CATEGORY_NAME_MAX_LENGTH) {
      throw new Error(`Category name must be at most ${CATEGORY_NAME_MAX_LENGTH} characters.`);
    }

    // Check uniqueness
    if (this.findGroupByName(db, name)) {
      throw new Error(`Category "${name}" already exists.`);
    }

    // Check max count
    const existing = this.getCategories();
    if (existing.length >= MAX_CATEGORIES) {
      throw new Error(`Maximum ${MAX_CATEGORIES} categories allowed.`);
    }

    // Create KDBX group under root
    const defaultGroup = db.getDefaultGroup();
    db.createGroup(defaultGroup, name);

    await this.save();
  }

  async renameCategory(oldName: string, newName: string): Promise<void> {
    const db = this.requireUnlockedDb();

    if (!newName || newName.length === 0) {
      throw new Error('Category name is required.');
    }
    if (newName.length > CATEGORY_NAME_MAX_LENGTH) {
      throw new Error(`Category name must be at most ${CATEGORY_NAME_MAX_LENGTH} characters.`);
    }

    const group = this.findGroupByName(db, oldName);
    if (!group) {
      throw new Error(`Category not found: ${oldName}`);
    }

    // Check uniqueness of new name
    if (oldName !== newName && this.findGroupByName(db, newName)) {
      throw new Error(`Category "${newName}" already exists.`);
    }

    group.name = newName;

    await this.save();
  }

  async deleteCategory(name: string): Promise<void> {
    const db = this.requireUnlockedDb();
    const defaultGroup = db.getDefaultGroup();

    const group = this.findGroupByName(db, name);
    if (!group) {
      throw new Error(`Category not found: ${name}`);
    }

    // Move all entries in this group back to root (uncategorized)
    const entries = [...group.entries];
    for (const entry of entries) {
      db.move(entry, defaultGroup);
    }

    // Move any sub-groups' entries to root too
    for (const subGroup of [...group.groups]) {
      for (const entry of [...subGroup.entries]) {
        db.move(entry, defaultGroup);
      }
    }

    // Remove the group itself
    db.remove(group);

    await this.save();
  }

  getCategories(): string[] {
    const db = this.requireUnlockedDb();
    const defaultGroup = db.getDefaultGroup();
    const recycleBinUuid = db.meta.recycleBinUuid;

    const categories: string[] = [];
    for (const group of defaultGroup.groups) {
      // Skip recycle bin
      if (recycleBinUuid && group.uuid.equals(recycleBinUuid)) {
        continue;
      }
      if (group.name) {
        categories.push(group.name);
      }
    }
    return categories;
  }

  async setTags(entryUuid: string, tags: string[]): Promise<void> {
    const db = this.requireUnlockedDb();
    const entry = this.findEntryByUuid(db, entryUuid);
    if (!entry) {
      throw new Error(`Entry not found: ${entryUuid}`);
    }

    if (tags.length > MAX_TAGS_PER_ENTRY) {
      throw new Error(`Maximum ${MAX_TAGS_PER_ENTRY} tags per entry.`);
    }
    for (const tag of tags) {
      if (tag.length > TAG_MAX_LENGTH) {
        throw new Error(`Each tag must be at most ${TAG_MAX_LENGTH} characters.`);
      }
    }

    entry.pushHistory();
    entry.tags = [...tags];
    entry.times.update();

    await this.save();
  }

  async createTag(name: string): Promise<void> {
    const db = this.requireUnlockedDb();

    if (!name || name.length === 0) {
      throw new Error('Tag name is required.');
    }
    if (name.length > TAG_MAX_LENGTH) {
      throw new Error(`Tag name must be at most ${TAG_MAX_LENGTH} characters.`);
    }

    const existing = this.getTags();
    if (existing.includes(name)) {
      throw new Error(`Tag "${name}" already exists.`);
    }
    if (existing.length >= MAX_TAGS) {
      throw new Error(`Maximum ${MAX_TAGS} tags allowed.`);
    }

    // Store tag registry on root group's customData
    const registry = [...existing, name];
    this.setTagRegistry(db, registry);

    await this.save();
  }

  async deleteTag(name: string): Promise<void> {
    const db = this.requireUnlockedDb();

    const existing = this.getTags();
    if (!existing.includes(name)) {
      throw new Error(`Tag not found: ${name}`);
    }

    // Remove from registry
    const registry = existing.filter((t) => t !== name);
    this.setTagRegistry(db, registry);

    // Cascade: remove from all entries that have this tag
    const defaultGroup = db.getDefaultGroup();
    const recycleBinUuid = db.meta.recycleBinUuid;
    for (const entry of defaultGroup.allEntries()) {
      if (recycleBinUuid && entry.parentGroup?.uuid.equals(recycleBinUuid)) {
        continue;
      }
      const idx = entry.tags.indexOf(name);
      if (idx !== -1) {
        entry.pushHistory();
        entry.tags.splice(idx, 1);
        entry.times.update();
      }
    }

    await this.save();
  }

  getTags(): string[] {
    const db = this.requireUnlockedDb();
    return this.getTagRegistry(db);
  }

  async setFavorite(entryUuid: string, favorite: boolean): Promise<void> {
    const db = this.requireUnlockedDb();
    const entry = this.findEntryByUuid(db, entryUuid);
    if (!entry) {
      throw new Error(`Entry not found: ${entryUuid}`);
    }

    entry.pushHistory();
    if (favorite) {
      this.setCustomData(entry, CUSTOM_KEY_FAVORITE, 'true');
    } else {
      this.deleteCustomData(entry, CUSTOM_KEY_FAVORITE);
    }
    entry.times.update();

    await this.save();
  }

  // ─── Import/Export (Task 14.2) ─────────────────────────────────────────────

  async importKdbx(
    file: ArrayBuffer,
    password: string
  ): Promise<import('@/lib/import-export').ImportResult> {
    const db = this.requireUnlockedDb();
    const { importKdbx } = await import('@/lib/import-export/kdbx-handler');
    const result = await importKdbx(db, file, password, this.cryptoAdapter);
    await this.save();
    return result;
  }

  async exportKdbx(): Promise<ArrayBuffer> {
    const db = this.requireUnlockedDb();
    const { exportKdbx } = await import('@/lib/import-export/kdbx-handler');
    return exportKdbx(db);
  }

  async importCsvEntries(csvContent: string): Promise<import('@/lib/import-export').ImportResult> {
    this.requireUnlockedDb();
    const { importCsv } = await import('@/lib/import-export/csv-handler');
    const { rows, result } = importCsv(csvContent);

    for (const row of rows) {
      await this.addEntry({
        title: row.title,
        username: row.username,
        password: row.password,
        url: row.url,
        notes: row.notes ?? '',
      });
    }

    return result;
  }

  async exportCsvEntries(): Promise<string> {
    const db = this.requireUnlockedDb();
    const { exportCsv } = await import('@/lib/import-export/csv-handler');
    const defaultGroup = db.getDefaultGroup();
    const recycleBinUuid = db.meta.recycleBinUuid;
    const entries: import('@/lib/import-export/csv-handler').CsvExportEntry[] = [];

    for (const entry of defaultGroup.allEntries()) {
      if (recycleBinUuid && entry.parentGroup?.uuid.equals(recycleBinUuid)) continue;
      entries.push({
        title: this.getStringField(entry, 'Title'),
        username: this.getStringField(entry, 'UserName'),
        password: this.getFieldText(entry, 'Password'),
        url: this.getStringField(entry, 'URL'),
        notes: this.getFieldText(entry, 'Notes'),
      });
    }

    return exportCsv(entries);
  }

  async runHealthCheck(): Promise<import('@/lib/vault-engine/health-check').HealthCheckResult> {
    const db = this.requireUnlockedDb();
    const { createVaultHealthCheck } = await import('@/lib/vault-engine/health-check');
    const check = createVaultHealthCheck();
    return check.run(db);
  }

  getPasswordHealthReport(
    oldPasswordDays = 90
  ): import('@/lib/vault-engine/password-health').PasswordHealthReport {
    const db = this.requireUnlockedDb();
    const defaultGroup = db.getDefaultGroup();
    const recycleBinUuid = db.meta.recycleBinUuid;

    const issues: import('@/lib/vault-engine/password-health').PasswordHealthIssue[] = [];
    const passwordHashes = new Map<string, string[]>(); // hash → list of entry titles
    const now = Date.now();
    const oldThresholdMs = oldPasswordDays * 24 * 60 * 60 * 1000;

    let totalEntries = 0;
    let totalPasswords = 0;
    let totalNotes = 0;
    let weakCount = 0;
    let oldCount = 0;
    let missingUrlCount = 0;
    let missingUsernameCount = 0;
    let noCategoryCount = 0;

    for (const entry of defaultGroup.allEntries()) {
      if (recycleBinUuid && entry.parentGroup?.uuid.equals(recycleBinUuid)) continue;

      totalEntries++;
      const type = this.getCustomDataValue(entry, CUSTOM_KEY_TYPE) === 'note' ? 'note' : 'password';
      const title = this.getStringField(entry, 'Title') || 'Untitled';
      const uuid = entry.uuid.toString();

      if (type === 'note') {
        totalNotes++;
        continue;
      }

      totalPasswords++;

      // Category check — skipped, UI doesn't have a category selector yet
      const isUncategorized = entry.parentGroup?.name === defaultGroup.name || !entry.parentGroup;
      if (isUncategorized) {
        noCategoryCount++;
      }

      // Username check
      const username = this.getStringField(entry, 'UserName');
      if (!username) {
        missingUsernameCount++;
        issues.push({ uuid, title, issue: 'missing-username' });
      }

      // URL check
      const url = this.getStringField(entry, 'URL');
      if (!url) {
        missingUrlCount++;
        issues.push({ uuid, title, issue: 'missing-url' });
      }

      // Password strength check
      const strength = this.computePasswordStrength(entry);
      if (strength === 'weak') {
        weakCount++;
        issues.push({ uuid, title, issue: 'weak' });
      }

      // Old password check
      const lastMod = entry.times.lastModTime;
      if (lastMod && now - lastMod.getTime() > oldThresholdMs) {
        oldCount++;
        issues.push({ uuid, title, issue: 'old' });
      }

      // Reuse detection: compute a simple hash of password for grouping
      const pwField = entry.fields.get('Password');
      if (pwField) {
        const pw = typeof pwField === 'string' ? pwField : pwField.getText();
        if (pw.length > 0) {
          // Simple string hash for grouping — NOT cryptographic, just for equality detection
          const hash = this.simpleHash(pw);
          if (!passwordHashes.has(hash)) {
            passwordHashes.set(hash, []);
          }
          passwordHashes.get(hash)!.push(uuid + '|' + title);
        }
      }
    }

    // Reused passwords: groups with 2+ entries sharing the same password
    let reusedCount = 0;
    for (const [, entries] of passwordHashes) {
      if (entries.length > 1) {
        for (const item of entries) {
          const [uuid, title] = item.split('|', 2);
          reusedCount++;
          issues.push({ uuid, title, issue: 'reused' });
        }
      }
    }

    // Compute score (100 = perfect, deductions for each issue type)
    let score = 100;
    if (totalPasswords > 0) {
      const weakPenalty = (weakCount / totalPasswords) * 30;
      const reusedPenalty = (reusedCount / totalPasswords) * 25;
      const oldPenalty = (oldCount / totalPasswords) * 15;
      const missingPenalty = ((missingUrlCount + missingUsernameCount) / (totalPasswords * 2)) * 20;
      score = Math.max(
        0,
        Math.round(score - weakPenalty - reusedPenalty - oldPenalty - missingPenalty)
      );
    }

    return {
      summary: {
        totalEntries,
        totalPasswords,
        totalNotes,
        weakPasswords: weakCount,
        reusedPasswords: reusedCount,
        oldPasswords: oldCount,
        missingUrls: missingUrlCount,
        missingUsernames: missingUsernameCount,
        noCategory: noCategoryCount,
        score,
      },
      issues,
      timestamp: new Date().toISOString(),
    };
  }

  /** Simple non-cryptographic hash for password equality grouping. Never exposed. */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      hash = ((hash << 5) - hash + ch) | 0;
    }
    return hash.toString(36);
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

  /**
   * Simple password strength classification for list-view indicators.
   * Uses character diversity + length heuristic. Does NOT expose the password value.
   */
  private computePasswordStrength(entry: kdbxweb.KdbxEntry): 'weak' | 'fair' | 'strong' {
    const val = entry.fields.get('Password');
    if (!val) return 'weak';
    const pw = typeof val === 'string' ? val : val.getText();
    const len = pw.length;
    if (len === 0) return 'weak';

    let charSets = 0;
    if (/[a-z]/.test(pw)) charSets++;
    if (/[A-Z]/.test(pw)) charSets++;
    if (/[0-9]/.test(pw)) charSets++;
    if (/[^a-zA-Z0-9]/.test(pw)) charSets++;

    if (len >= 12 && charSets >= 3) return 'strong';
    if (len >= 8 && charSets >= 2) return 'fair';
    return 'weak';
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
    const type =
      this.getCustomDataValue(entry, CUSTOM_KEY_TYPE) === 'note'
        ? ('note' as const)
        : ('password' as const);

    // M-1 fix: Use getFieldText which handles ProtectedValue for notes correctly
    const password = this.getFieldText(entry, 'Password');
    const notes = this.getFieldText(entry, 'Notes');

    const defaultGroup = this.db!.getDefaultGroup();
    const category =
      entry.parentGroup?.name !== defaultGroup.name ? entry.parentGroup?.name || null : null;

    // Extract custom fields (any field beyond the standard 5)
    const standardFields = new Set(['Title', 'UserName', 'Password', 'URL', 'Notes']);
    const customFields: import('@/types').CustomField[] = [];
    for (const [key, val] of entry.fields) {
      if (standardFields.has(key)) continue;
      const isProtected = val instanceof kdbxweb.ProtectedValue;
      customFields.push({
        key,
        value: isProtected ? val.getText() : (val ?? ''),
        protected: isProtected,
      });
    }

    // Extract attachment metadata
    const attachments: import('@/types').AttachmentMeta[] = [];
    for (const [key, bin] of entry.binaries) {
      const value = kdbxweb.KdbxBinaries.isKdbxBinaryWithHash(bin) ? bin.value : bin;
      let size = 0;
      if (value instanceof ArrayBuffer) {
        size = value.byteLength;
      } else if (value && typeof (value as kdbxweb.ProtectedValue).getBinary === 'function') {
        size = (value as kdbxweb.ProtectedValue).getBinary().byteLength;
      }
      attachments.push({ key, size });
    }

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
      customFields,
      attachments,
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

  setVaultContext(id: string, name: string): void {
    // Sets which vault to unlock — does NOT decrypt anything.
    // Used after page reload when we know the vault ID from IndexedDB metadata.
    this.vaultId = id;
    this.vaultName = name;
  }

  private findGroupByName(db: kdbxweb.Kdbx, name: string): kdbxweb.KdbxGroup | undefined {
    const defaultGroup = db.getDefaultGroup();
    const recycleBinUuid = db.meta.recycleBinUuid;

    for (const group of defaultGroup.groups) {
      if (recycleBinUuid && group.uuid.equals(recycleBinUuid)) {
        continue;
      }
      if (group.name === name) {
        return group;
      }
    }
    return undefined;
  }

  private getTagRegistry(db: kdbxweb.Kdbx): string[] {
    const defaultGroup = db.getDefaultGroup();
    if (!defaultGroup.customData) return [];
    const item = defaultGroup.customData.get(CUSTOM_KEY_TAG_REGISTRY);
    if (!item?.value) return [];
    try {
      const parsed = JSON.parse(item.value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private setTagRegistry(db: kdbxweb.Kdbx, tags: string[]): void {
    const defaultGroup = db.getDefaultGroup();
    if (!defaultGroup.customData) {
      defaultGroup.customData = new Map();
    }
    defaultGroup.customData.set(CUSTOM_KEY_TAG_REGISTRY, {
      value: JSON.stringify(tags),
    });
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
export function createVaultEngine(crypto: CryptoAdapter, storage: StorageAdapter): VaultEngine {
  return new VaultEngineImpl(crypto, storage);
}
