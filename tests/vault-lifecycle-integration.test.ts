// @vitest-environment node
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeAll, vi, afterEach } from 'vitest';
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

describe('Vault Lifecycle Integration', { timeout: 30_000 }, () => {
  beforeAll(async () => {
    await registerTestArgon2();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Create vault → add entries → lock → unlock → verify entries intact', () => {
    it('should preserve all entries after lock/unlock cycle', async () => {
      const { engine } = await createFreshEngine();

      // Create a vault
      const meta = await engine.create('master-password-123', 'LifecycleVault');
      expect(meta.name).toBe('LifecycleVault');
      expect(engine.isUnlocked()).toBe(true);

      // Add password entries
      const entry1 = await engine.addEntry({
        title: 'GitHub Account',
        username: 'dev@example.com',
        password: 'gh-secret-pass-123',
        url: 'https://github.com',
        notes: 'Main developer account',
        tags: ['development', 'git'],
        favorite: true,
      });

      const entry2 = await engine.addEntry({
        title: 'Email Account',
        username: 'user@mail.com',
        password: 'email-pass-456',
        url: 'https://mail.example.com',
        notes: 'Personal email',
        tags: ['personal'],
        favorite: false,
      });

      // Add a secure note
      const note1 = await engine.addNote({
        title: 'Recovery Codes',
        body: 'Code1: ABCDEF\nCode2: GHIJKL\nCode3: MNOPQR',
        tags: ['backup'],
        favorite: false,
      });

      // Save before locking
      await engine.save();

      // Verify entries are present before lock
      const entriesBefore = engine.listEntries();
      expect(entriesBefore).toHaveLength(3);

      // Lock the vault
      engine.lock();
      expect(engine.isUnlocked()).toBe(false);

      // Unlock with the same password
      const unlockMeta = await engine.unlock('master-password-123');
      expect(unlockMeta.name).toBe('LifecycleVault');
      expect(engine.isUnlocked()).toBe(true);

      // Verify all entries are intact
      const entriesAfter = engine.listEntries();
      expect(entriesAfter).toHaveLength(3);

      // Verify password entry 1
      const restored1 = engine.getEntry(entry1.uuid);
      expect(restored1.title).toBe('GitHub Account');
      expect(restored1.username).toBe('dev@example.com');
      expect(restored1.password).toBe('gh-secret-pass-123');
      expect(restored1.url).toBe('https://github.com');
      expect(restored1.notes).toBe('Main developer account');
      expect(restored1.tags).toEqual(['development', 'git']);
      expect(restored1.favorite).toBe(true);
      expect(restored1.type).toBe('password');

      // Verify password entry 2
      const restored2 = engine.getEntry(entry2.uuid);
      expect(restored2.title).toBe('Email Account');
      expect(restored2.username).toBe('user@mail.com');
      expect(restored2.password).toBe('email-pass-456');
      expect(restored2.url).toBe('https://mail.example.com');
      expect(restored2.notes).toBe('Personal email');
      expect(restored2.tags).toEqual(['personal']);
      expect(restored2.favorite).toBe(false);
      expect(restored2.type).toBe('password');

      // Verify secure note
      const restoredNote = engine.getEntry(note1.uuid);
      expect(restoredNote.title).toBe('Recovery Codes');
      expect(restoredNote.notes).toBe('Code1: ABCDEF\nCode2: GHIJKL\nCode3: MNOPQR');
      expect(restoredNote.type).toBe('note');
      expect(restoredNote.tags).toEqual(['backup']);
    });
  });

  describe('Create vault → add entries → export KDBX → import into new vault → verify match', () => {
    it('should export and import entries maintaining data integrity', async () => {
      // Create source vault with entries
      const { engine: sourceEngine } = await createFreshEngine();
      await sourceEngine.create('source-password', 'SourceVault');

      const entry1 = await sourceEngine.addEntry({
        title: 'Cloud Console',
        username: 'admin@example.com',
        password: 'cloud-strong-password',
        url: 'https://cloud.example.com',
        notes: 'Production account',
        tags: ['cloud', 'infra'],
        favorite: true,
      });

      const entry2 = await sourceEngine.addEntry({
        title: 'Database',
        username: 'dbadmin',
        password: 'db-pass-789',
        url: 'https://db.example.org',
        notes: 'Staging DB',
        tags: ['database'],
        favorite: false,
      });

      const note1 = await sourceEngine.addNote({
        title: 'Server IPs',
        body: '192.168.1.1\n10.0.0.1\n172.16.0.1',
        tags: ['infra'],
      });

      await sourceEngine.save();

      // Export as KDBX
      const exportedBuffer = await sourceEngine.exportKdbx();
      expect(exportedBuffer).toBeInstanceOf(ArrayBuffer);
      expect(exportedBuffer.byteLength).toBeGreaterThan(0);

      // Create a new target vault
      const { engine: targetEngine } = await createFreshEngine();
      await targetEngine.create('target-password', 'TargetVault');

      // Import the exported KDBX into the target vault
      const importResult = await targetEngine.importKdbx(exportedBuffer, 'source-password');
      expect(importResult.imported).toBe(3);

      await targetEngine.save();

      // Verify imported entries match
      const importedEntries = targetEngine.listEntries();
      expect(importedEntries).toHaveLength(3);

      // Find entries by title and verify their data
      const importedCloud = importedEntries.find((e) => e.title === 'Cloud Console');
      expect(importedCloud).toBeDefined();
      expect(importedCloud!.username).toBe('admin@example.com');
      expect(importedCloud!.tags).toEqual(['cloud', 'infra']);
      expect(importedCloud!.favorite).toBe(true);
      expect(importedCloud!.type).toBe('password');

      // Verify full entry details
      const cloudDetail = targetEngine.getEntry(importedCloud!.uuid);
      expect(cloudDetail.password).toBe('cloud-strong-password');
      expect(cloudDetail.url).toBe('https://cloud.example.com');
      expect(cloudDetail.notes).toBe('Production account');

      const importedDb = importedEntries.find((e) => e.title === 'Database');
      expect(importedDb).toBeDefined();
      expect(importedDb!.username).toBe('dbadmin');
      expect(importedDb!.tags).toEqual(['database']);

      const dbDetail = targetEngine.getEntry(importedDb!.uuid);
      expect(dbDetail.password).toBe('db-pass-789');

      const importedNote = importedEntries.find((e) => e.title === 'Server IPs');
      expect(importedNote).toBeDefined();
      expect(importedNote!.type).toBe('note');

      const noteDetail = targetEngine.getEntry(importedNote!.uuid);
      expect(noteDetail.notes).toBe('192.168.1.1\n10.0.0.1\n172.16.0.1');
    });
  });

  describe('Idle timeout triggers lock → all state cleared', () => {
    it('should lock vault and clear state when idle timeout fires', async () => {
      const { createIdleMonitor } = await import('@/lib/idle-monitor/idle-monitor');
      const { engine } = await createFreshEngine();

      // Create and unlock a vault (use real timers for async I/O)
      await engine.create('idle-test-pass', 'IdleVault');
      expect(engine.isUnlocked()).toBe(true);

      // Add entries
      await engine.addEntry({
        title: 'Idle Test Entry',
        username: 'user',
        password: 'pass123',
      });

      await engine.addNote({
        title: 'Idle Note',
        body: 'Some sensitive content',
      });

      await engine.save();

      // Verify entries exist
      expect(engine.listEntries()).toHaveLength(2);

      // Stub document for idle monitor (node environment has no DOM)
      const originalDocument = globalThis.document;
      globalThis.document = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as Document;

      // Switch to fake timers AFTER all async I/O is done
      vi.useFakeTimers();

      // Set up idle monitor that locks the vault on timeout
      const idleMonitor = createIdleMonitor();
      const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

      idleMonitor.start(TIMEOUT_MS, () => {
        engine.lock();
      });

      // Simulate idle timeout
      vi.advanceTimersByTime(TIMEOUT_MS);

      // Verify vault is locked
      expect(engine.isUnlocked()).toBe(false);

      // Verify entry data is not accessible (engine should throw or return empty)
      expect(() => engine.listEntries()).toThrow();

      // Clean up
      idleMonitor.stop();
      vi.useRealTimers();
      globalThis.document = originalDocument;
    });
  });
});
