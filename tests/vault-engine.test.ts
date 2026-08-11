// @vitest-environment node
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import * as kdbxweb from 'kdbxweb';

// Mock argon2-init BEFORE importing vault engine — prevents WASM load crash
vi.mock('@/lib/crypto/argon2-init', () => ({
  initArgon2: vi.fn().mockResolvedValue(undefined),
}));

// Register a simple fallback Argon2 implementation for testing purposes
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

// Helper to create fresh engine instances
async function createFreshEngine() {
  const { cryptoAdapter } = await import('@/lib/crypto/crypto-adapter');
  const { StorageAdapterImpl } = await import('@/lib/storage/storage-adapter');
  const { createVaultEngine } = await import('@/lib/vault-engine/vault-engine');

  const storage = new StorageAdapterImpl();
  const engine = createVaultEngine(cryptoAdapter, storage);
  return { engine, storage, cryptoAdapter };
}

describe('VaultEngine', { timeout: 30_000 }, () => {
  beforeAll(async () => {
    await registerTestArgon2();
  });

  describe('create()', () => {
    it('should create a vault and store it', async () => {
      const { engine, storage } = await createFreshEngine();
      const meta = await engine.create('test-password-123', 'MyVault');

      expect(meta).toBeDefined();
      expect(meta.id).toBeTruthy();
      expect(meta.name).toBe('MyVault');

      // Verify it was stored in IndexedDB
      const buffer = await storage.loadVault(meta.id);
      expect(buffer).not.toBeNull();
      expect(buffer!.byteLength).toBeGreaterThan(0);
    });

    it('should return VaultMeta with id, name, lastOpened', async () => {
      const { engine } = await createFreshEngine();
      const before = new Date().toISOString();
      const meta = await engine.create('password-abc', 'TestVault');
      const after = new Date().toISOString();

      expect(meta.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(meta.name).toBe('TestVault');
      expect(meta.lastOpened).toBeDefined();
      expect(meta.lastOpened >= before).toBe(true);
      expect(meta.lastOpened <= after).toBe(true);
    });

    // M-2: Password validation
    it('should reject empty password', async () => {
      const { engine } = await createFreshEngine();
      await expect(engine.create('', 'Test')).rejects.toThrow(/Password must be/);
    });

    it('should reject password exceeding 128 characters', async () => {
      const { engine } = await createFreshEngine();
      const longPass = 'a'.repeat(129);
      await expect(engine.create(longPass, 'Test')).rejects.toThrow(/Password must be/);
    });
  });

  describe('lock()', () => {
    it('should null the db reference', async () => {
      const { engine } = await createFreshEngine();
      await engine.create('password', 'LockTest');
      expect(engine.isUnlocked()).toBe(true);

      engine.lock();
      expect(engine.isUnlocked()).toBe(false);
    });

    it('followed by any access should indicate locked state', async () => {
      const { engine } = await createFreshEngine();
      await engine.create('password', 'LockTest2');
      engine.lock();

      expect(engine.isUnlocked()).toBe(false);
      // vaultId preserved for unlock
      expect(engine.getVaultId()).not.toBeNull();
    });
  });

  describe('unlock()', () => {
    it('should restore the vault after lock', async () => {
      const { engine } = await createFreshEngine();
      await engine.create('my-password', 'UnlockTest');
      const vaultId = engine.getVaultId();

      engine.lock();
      expect(engine.isUnlocked()).toBe(false);

      const meta = await engine.unlock('my-password');
      expect(engine.isUnlocked()).toBe(true);
      expect(meta.id).toBe(vaultId);
      expect(meta.name).toBe('UnlockTest');
    });

    it('with wrong password should throw and increment failedAttempts', async () => {
      const { engine } = await createFreshEngine();
      await engine.create('correct-password', 'BruteTest');
      engine.lock();

      await expect(engine.unlock('wrong-password')).rejects.toThrow('Incorrect password');

      const state = engine.getBruteForceState();
      expect(state.failedAttempts).toBe(1);
    });

    // C-1: Concurrent unlock prevention
    it('should reject concurrent unlock attempts', async () => {
      const { engine } = await createFreshEngine();
      await engine.create('my-pass', 'ConcurrentTest');
      engine.lock();

      // Start a first unlock — don't await it yet
      const p1 = engine.unlock('my-pass');
      // Immediately try a second unlock — should reject because first is in progress
      await expect(engine.unlock('my-pass')).rejects.toThrow(/already in progress/);
      // Let the first complete
      await p1;
    });

    it('should enforce incremental delay', async () => {
      const { engine } = await createFreshEngine();
      await engine.create('correct-pass', 'DelayTest');
      engine.lock();

      // First failure: no delay (failedAttempts=0) — use real timers
      await expect(engine.unlock('wrong')).rejects.toThrow();
      expect(engine.getBruteForceState().failedAttempts).toBe(1);

      // Second attempt: should have ~1000ms delay (failedAttempts=1)
      const startTime = Date.now();
      await expect(engine.unlock('wrong')).rejects.toThrow();
      const elapsed = Date.now() - startTime;
      // Verify delay was at least 900ms (allowing small timing variance)
      expect(elapsed).toBeGreaterThanOrEqual(900);
      expect(engine.getBruteForceState().failedAttempts).toBe(2);
    });

    it('after 5 failed unlocks should enter 60s cooldown', async () => {
      const { engine } = await createFreshEngine();
      await engine.create('correct-pass', 'CooldownTest');
      engine.lock();

      // Fail 5 times with real timers (delays: 0, 1s, 2s, 3s, 4s)
      for (let i = 0; i < 5; i++) {
        await expect(engine.unlock('wrong')).rejects.toThrow();
      }

      const state = engine.getBruteForceState();
      expect(state.failedAttempts).toBe(5);
      expect(state.cooldownUntil).toBeGreaterThan(Date.now());

      // Next attempt should immediately throw cooldown error
      await expect(engine.unlock('correct-pass')).rejects.toThrow(/wait.*seconds/i);
    });

    it('successful unlock should reset failedAttempts', async () => {
      const { engine } = await createFreshEngine();
      await engine.create('correct-pass', 'ResetTest');
      engine.lock();

      // Fail twice (delays: 0ms, then 1000ms)
      await expect(engine.unlock('wrong')).rejects.toThrow();
      await expect(engine.unlock('wrong')).rejects.toThrow();
      expect(engine.getBruteForceState().failedAttempts).toBe(2);

      // Succeed (delay: 2000ms)
      const meta = await engine.unlock('correct-pass');
      expect(meta).toBeDefined();
      expect(engine.getBruteForceState().failedAttempts).toBe(0);
      expect(engine.getBruteForceState().cooldownUntil).toBe(0);
    });

    // M-2: Password validation on unlock
    it('should reject empty password on unlock', async () => {
      const { engine } = await createFreshEngine();
      await engine.create('password', 'ValidateTest');
      engine.lock();
      await expect(engine.unlock('')).rejects.toThrow(/Password must be/);
    });
  });

  describe('open()', () => {
    it('should load an external KDBX file', async () => {
      const { cryptoAdapter } = await import('@/lib/crypto/crypto-adapter');
      const exportDb = await cryptoAdapter.createDatabase('open-test-pass', 'ExternalVault');
      const fileBuffer = await cryptoAdapter.saveDatabase(exportDb);

      const { engine } = await createFreshEngine();
      const meta = await engine.open(fileBuffer, 'open-test-pass');

      expect(meta).toBeDefined();
      expect(meta.id).toBeTruthy();
      expect(meta.name).toBe('ExternalVault');
      expect(engine.isUnlocked()).toBe(true);
    });

    it('with wrong password should increment failedOpenAttempts', async () => {
      const { cryptoAdapter } = await import('@/lib/crypto/crypto-adapter');
      const db = await cryptoAdapter.createDatabase('real-pass', 'TestFile');
      const fileBuffer = await cryptoAdapter.saveDatabase(db);

      const { engine } = await createFreshEngine();
      await expect(engine.open(fileBuffer, 'wrong-pass')).rejects.toThrow(
        'Failed to open vault file.'
      );

      const state = engine.getBruteForceState();
      expect(state.failedOpenAttempts).toBe(1);
    });

    // C-2 fix: Error message does NOT reveal password vs file validity
    it('should use generic error message that does not reveal password vs file issue', async () => {
      const { cryptoAdapter } = await import('@/lib/crypto/crypto-adapter');
      const db = await cryptoAdapter.createDatabase('real-pass', 'TestFile');
      const fileBuffer = await cryptoAdapter.saveDatabase(db);

      const { engine } = await createFreshEngine();
      try {
        await engine.open(fileBuffer, 'wrong-pass');
      } catch (err) {
        const msg = (err as Error).message;
        // Should NOT contain "password" or "check your password"
        expect(msg.toLowerCase()).not.toContain('password');
        // Should be the generic message
        expect(msg).toBe('Failed to open vault file.');
      }
    });

    it('after 5 failed opens should require re-select', async () => {
      const { cryptoAdapter } = await import('@/lib/crypto/crypto-adapter');
      const db = await cryptoAdapter.createDatabase('real-pass', 'TestFile');
      const fileBuffer = await cryptoAdapter.saveDatabase(db);

      const { engine } = await createFreshEngine();

      for (let i = 0; i < 4; i++) {
        await expect(engine.open(fileBuffer, 'wrong')).rejects.toThrow(
          'Failed to open vault file.'
        );
      }

      // 5th attempt triggers re-select
      await expect(engine.open(fileBuffer, 'wrong')).rejects.toThrow(/re-select/i);

      // Further attempts also throw re-select error immediately
      await expect(engine.open(fileBuffer, 'wrong')).rejects.toThrow(/re-select/i);
    });

    // H-2 fix: Invalid file format should NOT count toward brute-force
    it('should not count invalid file format toward failedOpenAttempts', async () => {
      const { engine } = await createFreshEngine();
      const garbageBuffer = new TextEncoder().encode('this is not a kdbx file')
        .buffer as ArrayBuffer;

      await expect(engine.open(garbageBuffer, 'any-pass')).rejects.toThrow(
        /not a supported vault format/i
      );

      // failedOpenAttempts should remain 0
      const state = engine.getBruteForceState();
      expect(state.failedOpenAttempts).toBe(0);
    });

    // C-1: Concurrent open prevention
    it('should reject concurrent open attempts', async () => {
      const { cryptoAdapter } = await import('@/lib/crypto/crypto-adapter');
      const db = await cryptoAdapter.createDatabase('pass', 'File');
      const fileBuffer = await cryptoAdapter.saveDatabase(db);

      const { engine } = await createFreshEngine();
      const p1 = engine.open(fileBuffer, 'pass');
      await expect(engine.open(fileBuffer, 'pass')).rejects.toThrow(/already in progress/);
      await p1;
    });

    // M-2: Password validation on open
    it('should reject empty password on open', async () => {
      const { engine } = await createFreshEngine();
      const fakeBuffer = new ArrayBuffer(100);
      await expect(engine.open(fakeBuffer, '')).rejects.toThrow(/Password must be/);
    });
  });

  describe('save()', () => {
    it('should persist current state to IndexedDB', async () => {
      const { engine, storage } = await createFreshEngine();
      const meta = await engine.create('save-pass', 'SaveTest');

      await expect(engine.save()).resolves.not.toThrow();

      const buffer = await storage.loadVault(meta.id);
      expect(buffer).not.toBeNull();
      expect(buffer!.byteLength).toBeGreaterThan(0);
    });

    it('should throw if no vault is loaded', async () => {
      const { engine } = await createFreshEngine();
      await expect(engine.save()).rejects.toThrow();
    });

    it('should throw if vault is locked', async () => {
      const { engine } = await createFreshEngine();
      await engine.create('pass', 'LockSaveTest');
      engine.lock();
      await expect(engine.save()).rejects.toThrow('No decrypted vault to save');
    });
  });
});
