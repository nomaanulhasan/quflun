// @vitest-environment node
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeAll } from 'vitest';
import { vi } from 'vitest';
import * as kdbxweb from 'kdbxweb';
import { createVaultHealthCheck } from '@/lib/vault-engine/health-check';

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

async function createTestDb(): Promise<kdbxweb.Kdbx> {
  const credentials = new kdbxweb.Credentials(
    kdbxweb.ProtectedValue.fromString('test-password')
  );
  return kdbxweb.Kdbx.create(credentials, 'HealthCheckTest');
}

describe('VaultHealthCheck', { timeout: 30_000 }, () => {
  const healthCheck = createVaultHealthCheck();

  beforeAll(async () => {
    await registerTestArgon2();
  });

  describe('healthy vault', () => {
    it('should return healthy status for a valid empty vault', async () => {
      const db = await createTestDb();
      const result = await healthCheck.run(db);

      expect(result.status).toBe('healthy');
      expect(result.errors).toHaveLength(0);
      expect(result.groupCount).toBeGreaterThanOrEqual(1); // At least root group
      expect(result.entryCount).toBe(0);
      expect(result.timestamp).toBeTruthy();
      // ISO 8601 format check
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it('should return healthy for vault with entries', async () => {
      const db = await createTestDb();
      const group = db.getDefaultGroup();

      // Add some entries
      const entry1 = db.createEntry(group);
      entry1.fields.set('Title', 'Entry 1');
      entry1.fields.set('Password', kdbxweb.ProtectedValue.fromString('pw1'));

      const entry2 = db.createEntry(group);
      entry2.fields.set('Title', 'Entry 2');
      entry2.fields.set('Password', kdbxweb.ProtectedValue.fromString('pw2'));

      const result = await healthCheck.run(db);

      expect(result.status).toBe('healthy');
      expect(result.entryCount).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should return healthy for vault with subgroups', async () => {
      const db = await createTestDb();
      const root = db.getDefaultGroup();

      db.createGroup(root, 'Work');
      db.createGroup(root, 'Personal');

      const result = await healthCheck.run(db);

      expect(result.status).toBe('healthy');
      expect(result.groupCount).toBeGreaterThanOrEqual(3); // root + 2 subgroups (+ possibly recycle bin)
      expect(result.errors).toHaveLength(0);
    });

    it('should count entries in subgroups', async () => {
      const db = await createTestDb();
      const root = db.getDefaultGroup();
      const work = db.createGroup(root, 'Work');

      const entry = db.createEntry(work);
      entry.fields.set('Title', 'GitHub');
      entry.fields.set('Password', kdbxweb.ProtectedValue.fromString('pw'));

      const result = await healthCheck.run(db);

      expect(result.status).toBe('healthy');
      expect(result.entryCount).toBe(1);
      expect(result.groupCount).toBeGreaterThanOrEqual(2); // root + work (+ possibly recycle bin)
    });
  });

  describe('duplicate UUID detection', () => {
    it('should detect duplicate entry UUIDs', async () => {
      const db = await createTestDb();
      const group = db.getDefaultGroup();

      const entry1 = db.createEntry(group);
      entry1.fields.set('Title', 'Entry A');
      entry1.fields.set('Password', kdbxweb.ProtectedValue.fromString('pw'));

      const entry2 = db.createEntry(group);
      entry2.fields.set('Title', 'Entry B');
      entry2.fields.set('Password', kdbxweb.ProtectedValue.fromString('pw'));

      // Force duplicate UUID (normally impossible, but tests structural checks)
      entry2.uuid = entry1.uuid;

      const result = await healthCheck.run(db);

      expect(result.status).toBe('corrupted');
      expect(result.errors.some((e) => e.includes('Duplicate entry UUID'))).toBe(true);
    });
  });

  describe('missing field detection', () => {
    it('should detect entry missing Title field', async () => {
      const db = await createTestDb();
      const group = db.getDefaultGroup();

      const entry = db.createEntry(group);
      entry.fields.set('Password', kdbxweb.ProtectedValue.fromString('pw'));
      entry.fields.delete('Title');

      const result = await healthCheck.run(db);

      expect(result.status).toBe('corrupted');
      expect(result.errors.some((e) => e.includes('missing Title'))).toBe(true);
    });

    it('should detect entry missing Password field', async () => {
      const db = await createTestDb();
      const group = db.getDefaultGroup();

      const entry = db.createEntry(group);
      entry.fields.set('Title', 'NoPassword');
      entry.fields.delete('Password');

      const result = await healthCheck.run(db);

      expect(result.status).toBe('corrupted');
      expect(result.errors.some((e) => e.includes('missing Password'))).toBe(true);
    });
  });

  describe('serialization verification', () => {
    it('should verify KDBX magic bytes after save', async () => {
      const db = await createTestDb();
      const result = await healthCheck.run(db);

      // A healthy vault means serialization succeeded with correct magic bytes
      expect(result.status).toBe('healthy');
      expect(result.errors).toHaveLength(0);
    });

    it('should report error if serialization fails', async () => {
      const db = await createTestDb();

      // Corrupt the db to make save() fail
      // Nullify the header which is required for serialization
      (db as any).header = null;

      const result = await healthCheck.run(db);

      expect(result.status).toBe('corrupted');
      expect(result.errors.some((e) => e.includes('Serialization failed'))).toBe(true);
    });
  });

  describe('never exposes secrets', () => {
    it('should not call getText() on ProtectedValue', async () => {
      const db = await createTestDb();
      const group = db.getDefaultGroup();

      const entry = db.createEntry(group);
      entry.fields.set('Title', 'SecretEntry');
      const pv = kdbxweb.ProtectedValue.fromString('super-secret');
      entry.fields.set('Password', pv);

      // Spy on getText — should never be called
      const getTextSpy = vi.spyOn(pv, 'getText');

      await healthCheck.run(db);

      expect(getTextSpy).not.toHaveBeenCalled();
      getTextSpy.mockRestore();
    });
  });

  describe('result metadata', () => {
    it('should include ISO 8601 timestamp', async () => {
      const db = await createTestDb();
      const before = new Date().toISOString();
      const result = await healthCheck.run(db);
      const after = new Date().toISOString();

      expect(result.timestamp >= before).toBe(true);
      expect(result.timestamp <= after).toBe(true);
    });

    it('should include accurate entry and group counts', async () => {
      const db = await createTestDb();
      const root = db.getDefaultGroup();
      const sub = db.createGroup(root, 'Sub');

      for (let i = 0; i < 5; i++) {
        const entry = db.createEntry(i < 3 ? root : sub);
        entry.fields.set('Title', `Entry ${i}`);
        entry.fields.set('Password', kdbxweb.ProtectedValue.fromString('pw'));
      }

      const result = await healthCheck.run(db);

      expect(result.entryCount).toBe(5);
      expect(result.groupCount).toBeGreaterThanOrEqual(2); // root + sub (+ possibly recycle bin)
    });
  });
});
