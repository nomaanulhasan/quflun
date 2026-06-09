// @vitest-environment node
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeAll } from 'vitest';
import { vi } from 'vitest';
import * as kdbxweb from 'kdbxweb';
import { importKdbx, exportKdbx } from '@/lib/import-export';

vi.mock('@/lib/crypto/argon2-init', () => ({
  initArgon2: vi.fn().mockResolvedValue(undefined),
}));

async function registerTestArgon2(): Promise<void> {
  const { createHash } = await import('node:crypto');
  kdbxweb.CryptoEngine.setArgon2Impl(
    async (
      password: ArrayBuffer,
      salt: ArrayBuffer,
      _memory: number,
      _iterations: number,
      length: number,
      _parallelism: number,
      _type: number,
      _version: number
    ): Promise<ArrayBuffer> => {
      const hash = createHash('sha512');
      hash.update(new Uint8Array(password));
      hash.update(new Uint8Array(salt));
      const result = hash.digest();
      const output = new Uint8Array(length);
      output.set(result.subarray(0, Math.min(result.length, length)));
      return output.buffer as ArrayBuffer;
    }
  );
}

async function getCryptoAdapter() {
  const { cryptoAdapter } = await import('@/lib/crypto/crypto-adapter');
  return cryptoAdapter;
}

async function createTestDb(name: string, password = 'test-pass'): Promise<kdbxweb.Kdbx> {
  const credentials = new kdbxweb.Credentials(
    kdbxweb.ProtectedValue.fromString(password)
  );
  return kdbxweb.Kdbx.create(credentials, name);
}

describe('KDBX Import/Export (Task 8.1)', { timeout: 30_000 }, () => {
  beforeAll(async () => {
    await registerTestArgon2();
  });

  describe('exportKdbx()', () => {
    it('should export database to ArrayBuffer', async () => {
      const db = await createTestDb('ExportTest');
      const buffer = await exportKdbx(db);

      expect(buffer).toBeInstanceOf(ArrayBuffer);
      expect(buffer.byteLength).toBeGreaterThan(0);

      // Verify KDBX magic bytes
      const view = new DataView(buffer);
      const magic = view.getUint32(0, true);
      expect(magic).toBe(0x9aa2d903);
    });

    it('should export database with entries', async () => {
      const db = await createTestDb('WithEntries');
      const group = db.getDefaultGroup();

      const entry = db.createEntry(group);
      entry.fields.set('Title', 'Exported Entry');
      entry.fields.set('Password', kdbxweb.ProtectedValue.fromString('pw'));

      const buffer = await exportKdbx(db);
      expect(buffer.byteLength).toBeGreaterThan(0);
    });
  });

  describe('importKdbx()', () => {
    it('should import entries from an external KDBX file', async () => {
      const crypto = await getCryptoAdapter();

      // Create source with entries
      const sourceDb = await createTestDb('Source', 'source-pw');
      const sourceGroup = sourceDb.getDefaultGroup();

      const e1 = sourceDb.createEntry(sourceGroup);
      e1.fields.set('Title', 'GitHub');
      e1.fields.set('UserName', 'user1');
      e1.fields.set('Password', kdbxweb.ProtectedValue.fromString('pw1'));

      const e2 = sourceDb.createEntry(sourceGroup);
      e2.fields.set('Title', 'AWS');
      e2.fields.set('UserName', 'admin');
      e2.fields.set('Password', kdbxweb.ProtectedValue.fromString('pw2'));

      const sourceBuffer = await sourceDb.save();

      // Create target (empty)
      const targetDb = await createTestDb('Target');

      const result = await importKdbx(targetDb, sourceBuffer, 'source-pw', crypto);

      expect(result.imported).toBe(2);
      expect(result.skipped).toHaveLength(0);
      expect(result.total).toBe(2);

      // Verify entries are in target
      const targetEntries = [...targetDb.getDefaultGroup().allEntries()];
      expect(targetEntries.length).toBe(2);
    });

    it('should skip entries with matching UUIDs (Requirement 9.1)', async () => {
      const crypto = await getCryptoAdapter();

      // Create source with one entry
      const sourceDb = await createTestDb('Source', 'pw');
      const sourceGroup = sourceDb.getDefaultGroup();
      const sourceEntry = sourceDb.createEntry(sourceGroup);
      sourceEntry.fields.set('Title', 'Existing');
      sourceEntry.fields.set('Password', kdbxweb.ProtectedValue.fromString('pw'));
      const sourceBuffer = await sourceDb.save();

      // Create target with an entry that has the SAME UUID
      const targetDb = await createTestDb('Target');
      const targetGroup = targetDb.getDefaultGroup();
      const targetEntry = targetDb.createEntry(targetGroup);
      targetEntry.fields.set('Title', 'Local Version');
      targetEntry.fields.set('Password', kdbxweb.ProtectedValue.fromString('local'));

      // Force same UUID
      // We need to reload source to get its actual entry
      const reloadedSource = await crypto.loadDatabase(sourceBuffer, 'pw');
      const sourceEntries = [...reloadedSource.getDefaultGroup().allEntries()];
      targetEntry.uuid = sourceEntries[0].uuid;

      const result = await importKdbx(targetDb, sourceBuffer, 'pw', crypto);

      expect(result.imported).toBe(0);
      expect(result.skipped.length).toBe(1);
      expect(result.skipped[0].reason).toContain('already exists');

      // Local entry preserved unchanged
      const title = targetEntry.fields.get('Title') as string;
      expect(title).toBe('Local Version');
    });

    it('should skip entries in source recycle bin', async () => {
      const crypto = await getCryptoAdapter();

      const sourceDb = await createTestDb('Source', 'pw');
      const sourceGroup = sourceDb.getDefaultGroup();

      const entry = sourceDb.createEntry(sourceGroup);
      entry.fields.set('Title', 'Deleted');
      entry.fields.set('Password', kdbxweb.ProtectedValue.fromString('pw'));

      // Move to recycle bin
      sourceDb.remove(entry);

      const sourceBuffer = await sourceDb.save();
      const targetDb = await createTestDb('Target');

      const result = await importKdbx(targetDb, sourceBuffer, 'pw', crypto);

      expect(result.imported).toBe(0);
      expect(result.skipped.some((s) => s.reason.includes('recycle bin'))).toBe(true);
    });

    it('should match source groups by name in target', async () => {
      const crypto = await getCryptoAdapter();

      const sourceDb = await createTestDb('Source', 'pw');
      const sourceRoot = sourceDb.getDefaultGroup();
      const sourceWork = sourceDb.createGroup(sourceRoot, 'Work');

      const entry = sourceDb.createEntry(sourceWork);
      entry.fields.set('Title', 'In Work Group');
      entry.fields.set('Password', kdbxweb.ProtectedValue.fromString('pw'));

      const sourceBuffer = await sourceDb.save();

      // Target already has a "Work" group
      const targetDb = await createTestDb('Target');
      const targetRoot = targetDb.getDefaultGroup();
      const targetWork = targetDb.createGroup(targetRoot, 'Work');

      const result = await importKdbx(targetDb, sourceBuffer, 'pw', crypto);

      expect(result.imported).toBe(1);
      // Entry should be in the existing "Work" group
      expect(targetWork.entries.length).toBe(1);
    });

    it('should create missing groups in target', async () => {
      const crypto = await getCryptoAdapter();

      const sourceDb = await createTestDb('Source', 'pw');
      const sourceRoot = sourceDb.getDefaultGroup();
      const sourcePersonal = sourceDb.createGroup(sourceRoot, 'Personal');

      const entry = sourceDb.createEntry(sourcePersonal);
      entry.fields.set('Title', 'In Personal');
      entry.fields.set('Password', kdbxweb.ProtectedValue.fromString('pw'));

      const sourceBuffer = await sourceDb.save();
      const targetDb = await createTestDb('Target');

      const result = await importKdbx(targetDb, sourceBuffer, 'pw', crypto);

      expect(result.imported).toBe(1);

      // "Personal" group should have been created in target
      const targetRoot = targetDb.getDefaultGroup();
      const personalGroup = targetRoot.groups.find((g) => g.name === 'Personal');
      expect(personalGroup).toBeDefined();
      expect(personalGroup!.entries.length).toBe(1);
    });

    it('should reject file exceeding 100 MB', async () => {
      const crypto = await getCryptoAdapter();
      const targetDb = await createTestDb('Target');

      // Create a buffer slightly over 100 MB
      const bigBuffer = new ArrayBuffer(101 * 1024 * 1024);

      await expect(
        importKdbx(targetDb, bigBuffer, 'pw', crypto)
      ).rejects.toThrow(/maximum size/);
    });

    it('should reject wrong password with clear error', async () => {
      const crypto = await getCryptoAdapter();

      const sourceDb = await createTestDb('Source', 'correct-pw');
      const sourceBuffer = await sourceDb.save();
      const targetDb = await createTestDb('Target');

      await expect(
        importKdbx(targetDb, sourceBuffer, 'wrong-pw', crypto)
      ).rejects.toThrow(/password/i);
    });

    it('should reject invalid (non-KDBX) file', async () => {
      const crypto = await getCryptoAdapter();
      const targetDb = await createTestDb('Target');
      const garbage = new TextEncoder().encode('not a kdbx file').buffer as ArrayBuffer;

      await expect(
        importKdbx(targetDb, garbage, 'any', crypto)
      ).rejects.toThrow(/not a valid KDBX/);
    });

    it('should return detailed ImportResult', async () => {
      const crypto = await getCryptoAdapter();

      const sourceDb = await createTestDb('Source', 'pw');
      const sourceGroup = sourceDb.getDefaultGroup();

      for (let i = 0; i < 5; i++) {
        const e = sourceDb.createEntry(sourceGroup);
        e.fields.set('Title', `Entry ${i}`);
        e.fields.set('Password', kdbxweb.ProtectedValue.fromString(`pw${i}`));
      }

      const sourceBuffer = await sourceDb.save();
      const targetDb = await createTestDb('Target');

      const result = await importKdbx(targetDb, sourceBuffer, 'pw', crypto);

      expect(result.imported).toBe(5);
      expect(result.total).toBe(5);
      expect(result.skipped).toHaveLength(0);
    });
  });

  describe('export/import round-trip (Requirement 9.6)', () => {
    it('should produce identical entries after export then import', async () => {
      const crypto = await getCryptoAdapter();

      // Create source with entries
      const sourceDb = await createTestDb('Original', 'round-trip-pw');
      const sourceGroup = sourceDb.getDefaultGroup();

      const entry = sourceDb.createEntry(sourceGroup);
      entry.fields.set('Title', 'RoundTrip');
      entry.fields.set('UserName', 'admin');
      entry.fields.set('Password', kdbxweb.ProtectedValue.fromString('secret123'));
      entry.fields.set('URL', 'https://example.com');
      entry.fields.set('Notes', 'Important note');

      // Export
      const exported = await exportKdbx(sourceDb);

      // Import into empty target
      const targetDb = await createTestDb('Destination');
      const result = await importKdbx(targetDb, exported, 'round-trip-pw', crypto);

      expect(result.imported).toBe(1);

      // Verify entry fields match
      const targetEntries = [...targetDb.getDefaultGroup().allEntries()];
      expect(targetEntries.length).toBe(1);

      const imported = targetEntries[0];
      expect(imported.fields.get('Title')).toBe('RoundTrip');
      expect(imported.fields.get('UserName')).toBe('admin');
      expect(imported.fields.get('URL')).toBe('https://example.com');
      expect(imported.fields.get('Notes')).toBe('Important note');

      // Password preserved as ProtectedValue
      const pw = imported.fields.get('Password');
      expect(pw).toBeDefined();
      expect(typeof pw).not.toBe('string');
      expect((pw as kdbxweb.ProtectedValue).getText()).toBe('secret123');
    });
  });

  describe('repeated import deduplication', () => {
    it('should NOT create duplicates when importing the same file twice', async () => {
      const crypto = await getCryptoAdapter();

      // Create source with entries
      const sourceDb = await createTestDb('Source', 'pw');
      const sourceGroup = sourceDb.getDefaultGroup();
      const e = sourceDb.createEntry(sourceGroup);
      e.fields.set('Title', 'OnlyOnce');
      e.fields.set('Password', kdbxweb.ProtectedValue.fromString('pw'));
      const sourceBuffer = await sourceDb.save();

      // Import first time
      const targetDb = await createTestDb('Target');
      const result1 = await importKdbx(targetDb, sourceBuffer, 'pw', crypto);
      expect(result1.imported).toBe(1);

      // Import same file second time
      const result2 = await importKdbx(targetDb, sourceBuffer, 'pw', crypto);
      expect(result2.imported).toBe(0);
      expect(result2.skipped.length).toBe(1);
      expect(result2.skipped[0].reason).toContain('already exists');

      // Verify only 1 entry in target
      const entries = [...targetDb.getDefaultGroup().allEntries()];
      expect(entries.length).toBe(1);
    });

    it('should track _qufly_source_uuid on imported entries', async () => {
      const crypto = await getCryptoAdapter();

      const sourceDb = await createTestDb('Source', 'pw');
      const sourceGroup = sourceDb.getDefaultGroup();
      const entry = sourceDb.createEntry(sourceGroup);
      entry.fields.set('Title', 'Tracked');
      entry.fields.set('Password', kdbxweb.ProtectedValue.fromString('pw'));
      const sourceBuffer = await sourceDb.save();

      // Get the source entry UUID (after save/reload)
      const reloadedSource = await crypto.loadDatabase(sourceBuffer, 'pw');
      const sourceEntries = [...reloadedSource.getDefaultGroup().allEntries()];
      const sourceUuid = sourceEntries[0].uuid.toString();

      const targetDb = await createTestDb('Target');
      await importKdbx(targetDb, sourceBuffer, 'pw', crypto);

      const targetEntries = [...targetDb.getDefaultGroup().allEntries()];
      expect(targetEntries.length).toBe(1);

      // The imported entry should have _qufly_source_uuid tracking the original
      const trackedUuid = targetEntries[0].customData?.get('_qufly_source_uuid')?.value;
      expect(trackedUuid).toBe(sourceUuid);
    });
  });

  describe('Qufly metadata preservation', () => {
    it('should preserve _qufly_type=note on imported entries', async () => {
      const crypto = await getCryptoAdapter();

      const sourceDb = await createTestDb('Source', 'pw');
      const sourceGroup = sourceDb.getDefaultGroup();
      const entry = sourceDb.createEntry(sourceGroup);
      entry.fields.set('Title', 'My Note');
      entry.fields.set('Password', kdbxweb.ProtectedValue.fromString(''));
      entry.fields.set('Notes', 'Note body content');
      entry.customData = new Map();
      entry.customData.set('_qufly_type', { value: 'note' });

      const sourceBuffer = await sourceDb.save();
      const targetDb = await createTestDb('Target');

      await importKdbx(targetDb, sourceBuffer, 'pw', crypto);

      const targetEntries = [...targetDb.getDefaultGroup().allEntries()];
      expect(targetEntries.length).toBe(1);

      const importedType = targetEntries[0].customData?.get('_qufly_type')?.value;
      expect(importedType).toBe('note');
    });

    it('should preserve _qufly_favorite on imported entries', async () => {
      const crypto = await getCryptoAdapter();

      const sourceDb = await createTestDb('Source', 'pw');
      const sourceGroup = sourceDb.getDefaultGroup();
      const entry = sourceDb.createEntry(sourceGroup);
      entry.fields.set('Title', 'Fav Entry');
      entry.fields.set('Password', kdbxweb.ProtectedValue.fromString('pw'));
      entry.customData = new Map();
      entry.customData.set('_qufly_favorite', { value: 'true' });

      const sourceBuffer = await sourceDb.save();
      const targetDb = await createTestDb('Target');

      await importKdbx(targetDb, sourceBuffer, 'pw', crypto);

      const targetEntries = [...targetDb.getDefaultGroup().allEntries()];
      expect(targetEntries.length).toBe(1);

      const fav = targetEntries[0].customData?.get('_qufly_favorite')?.value;
      expect(fav).toBe('true');
    });

    it('should preserve multiple _qufly_* keys together', async () => {
      const crypto = await getCryptoAdapter();

      const sourceDb = await createTestDb('Source', 'pw');
      const sourceGroup = sourceDb.getDefaultGroup();
      const entry = sourceDb.createEntry(sourceGroup);
      entry.fields.set('Title', 'Full Meta');
      entry.fields.set('Password', kdbxweb.ProtectedValue.fromString(''));
      entry.fields.set('Notes', 'A note');
      entry.customData = new Map();
      entry.customData.set('_qufly_type', { value: 'note' });
      entry.customData.set('_qufly_favorite', { value: 'true' });

      const sourceBuffer = await sourceDb.save();
      const targetDb = await createTestDb('Target');

      await importKdbx(targetDb, sourceBuffer, 'pw', crypto);

      const targetEntries = [...targetDb.getDefaultGroup().allEntries()];
      const cd = targetEntries[0].customData;

      expect(cd?.get('_qufly_type')?.value).toBe('note');
      expect(cd?.get('_qufly_favorite')?.value).toBe('true');
      expect(cd?.get('_qufly_source_uuid')?.value).toBeTruthy();
    });
  });
});
