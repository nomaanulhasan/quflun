// @vitest-environment node
import { describe, it, expect, beforeAll, vi } from 'vitest';
import * as kdbxweb from 'kdbxweb';

/**
 * Crypto Adapter tests.
 *
 * argon2-browser requires WASM loading which crashes in Node.js test
 * environments. We:
 * 1. Register a SHA-512-based test KDF with kdbxweb
 * 2. Mock the argon2-init module so the adapter's ensureInitialized() doesn't
 *    try to load the real argon2-browser WASM
 */

// Mock argon2-init BEFORE importing the adapter — prevents WASM load crash
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
      // Simple KDF for testing only — NOT cryptographically equivalent to Argon2
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

describe('CryptoAdapter', () => {
  beforeAll(async () => {
    await registerTestArgon2();
  });

  it('should have all required interface methods', async () => {
    const { cryptoAdapter } = await import('@/lib/crypto');
    expect(cryptoAdapter).toBeDefined();
    expect(typeof cryptoAdapter.initialize).toBe('function');
    expect(typeof cryptoAdapter.createDatabase).toBe('function');
    expect(typeof cryptoAdapter.loadDatabase).toBe('function');
    expect(typeof cryptoAdapter.saveDatabase).toBe('function');
    expect(typeof cryptoAdapter.generateRandom).toBe('function');
  });

  // M-4 fix: Test the actual cryptoAdapter.createDatabase method
  it('should create a database via cryptoAdapter with correct name', async () => {
    const { cryptoAdapter } = await import('@/lib/crypto');
    const db = await cryptoAdapter.createDatabase('test-password', 'TestVault');
    expect(db).toBeDefined();
    expect(db.meta.name).toBe('TestVault');
  });

  // M-4 fix: Verify Argon2id parameters are set correctly
  it('should configure Argon2id parameters (64MB, 2 iterations, 1 parallelism)', async () => {
    const { cryptoAdapter } = await import('@/lib/crypto');
    const db = await cryptoAdapter.createDatabase('test-password', 'ParamTest');

    const kdfParams = db.header.kdfParameters;
    expect(kdfParams).toBeDefined();

    // Memory: 64 MB = 64 * 1024 * 1024 bytes = 67108864
    const memory = kdfParams!.get('M');
    expect(memory).toBeDefined();
    expect(Number(memory)).toBe(64 * 1024 * 1024);

    // Iterations: 2
    const iterations = kdfParams!.get('I');
    expect(iterations).toBeDefined();
    expect(Number(iterations)).toBe(2);

    // Parallelism: 1
    const parallelism = kdfParams!.get('P');
    expect(parallelism).toBeDefined();
    expect(Number(parallelism)).toBe(1);
  });

  // M-4 fix: Test the full round-trip via cryptoAdapter (not raw kdbxweb)
  it('should perform create/save/load round-trip via cryptoAdapter', async () => {
    const { cryptoAdapter } = await import('@/lib/crypto');
    const password = 'my-strong-password-123';
    const name = 'RoundTripVault';

    // Create via adapter
    const db = await cryptoAdapter.createDatabase(password, name);
    expect(db).toBeDefined();

    // Save via adapter
    const buffer = await cryptoAdapter.saveDatabase(db);
    expect(buffer).toBeInstanceOf(ArrayBuffer);
    expect(buffer.byteLength).toBeGreaterThan(0);

    // Load via adapter
    const loadedDb = await cryptoAdapter.loadDatabase(buffer, password);
    expect(loadedDb).toBeDefined();
    expect(loadedDb.meta.name).toBe(name);
  });

  it('should generate random bytes of specified length', async () => {
    const { cryptoAdapter } = await import('@/lib/crypto');
    const bytes = cryptoAdapter.generateRandom(32);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBe(32);

    // Verify not all zeros
    const allZeros = bytes.every((b) => b === 0);
    expect(allZeros).toBe(false);
  });

  it('should generate different random bytes each call', async () => {
    const { cryptoAdapter } = await import('@/lib/crypto');
    const a = cryptoAdapter.generateRandom(32);
    const b = cryptoAdapter.generateRandom(32);
    const equal = a.every((byte, i) => byte === b[i]);
    expect(equal).toBe(false);
  });

  it('should reject loading with wrong password via cryptoAdapter', async () => {
    const { cryptoAdapter } = await import('@/lib/crypto');
    const db = await cryptoAdapter.createDatabase('correct-password', 'TestDB');
    const buffer = await cryptoAdapter.saveDatabase(db);

    await expect(
      cryptoAdapter.loadDatabase(buffer, 'wrong-password')
    ).rejects.toThrow();
  });
});
