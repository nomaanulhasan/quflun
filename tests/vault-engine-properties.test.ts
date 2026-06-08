// @vitest-environment node
/**
 * Property-based tests for Vault Engine (Tasks 4.5–4.11)
 * Uses fast-check for randomized input generation and shrinking.
 */
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeAll } from 'vitest';
import { vi } from 'vitest';
import * as fc from 'fast-check';
import * as kdbxweb from 'kdbxweb';
import type { EntryInput } from '@/types';

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

async function createUnlockedEngine() {
  const { cryptoAdapter } = await import('@/lib/crypto/crypto-adapter');
  const { StorageAdapterImpl } = await import('@/lib/storage/storage-adapter');
  const { createVaultEngine } = await import('@/lib/vault-engine/vault-engine');

  const storage = new StorageAdapterImpl();
  const engine = createVaultEngine(cryptoAdapter, storage);
  await engine.create('property-test-pw', 'PropTestVault');
  return engine;
}

// Arbitraries for generating valid entry inputs
const validTitle = fc.string({ minLength: 1, maxLength: 256 });
const validPassword = fc.string({ minLength: 1, maxLength: 100 }); // Keep short for perf
const validUsername = fc.string({ minLength: 0, maxLength: 100 });
const validUrl = fc.string({ minLength: 0, maxLength: 200 });
const validNotes = fc.string({ minLength: 0, maxLength: 500 });
const validTag = fc.string({ minLength: 1, maxLength: 64 }).filter((s) => s.trim().length > 0);
const validTags = fc.array(validTag, { minLength: 0, maxLength: 20 });

const validEntryInput: fc.Arbitrary<EntryInput> = fc.record({
  title: validTitle,
  password: validPassword,
  username: validUsername,
  url: validUrl,
  notes: validNotes,
  tags: validTags,
  favorite: fc.boolean(),
});

describe('Property Tests — Vault Engine (Tasks 4.5–4.11)', { timeout: 60_000 }, () => {
  beforeAll(async () => {
    await registerTestArgon2();
  });

  // ─── Property 1: Entry add round-trip (Task 4.5) ────────────────────────────
  describe('Property 1: Entry add round-trip', () => {
    it('for any valid input, addEntry followed by getEntry returns matching data', async () => {
      const engine = await createUnlockedEngine();

      await fc.assert(
        fc.asyncProperty(validEntryInput, async (input) => {
          const meta = await engine.addEntry(input);
          const entry = engine.getEntry(meta.uuid);

          expect(entry.title).toBe(input.title);
          expect(entry.username).toBe(input.username || '');
          expect(entry.password).toBe(input.password);
          expect(entry.url).toBe(input.url || '');
          expect(entry.notes).toBe(input.notes || '');
          expect(entry.tags).toEqual(input.tags || []);
          expect(entry.favorite).toBe(input.favorite || false);
          expect(entry.type).toBe('password');
          expect(entry.createdAt).toBeTruthy();
          expect(entry.modifiedAt).toBeTruthy();
        }),
        { numRuns: 10 } // Keep low for CI speed
      );
    });
  });

  // ─── Property 2: Entry validation rejects invalid inputs (Task 4.6) ─────────
  describe('Property 2: Entry validation rejects invalid inputs', () => {
    it('empty title is always rejected', async () => {
      const engine = await createUnlockedEngine();

      await fc.assert(
        fc.asyncProperty(validPassword, async (pw) => {
          await expect(engine.addEntry({ title: '', password: pw })).rejects.toThrow(
            'Title is required'
          );
        }),
        { numRuns: 5 }
      );
    });

    it('empty password is always rejected', async () => {
      const engine = await createUnlockedEngine();

      await fc.assert(
        fc.asyncProperty(validTitle, async (title) => {
          await expect(engine.addEntry({ title, password: '' })).rejects.toThrow(
            'Password is required'
          );
        }),
        { numRuns: 5 }
      );
    });

    it('title exceeding 256 chars is rejected', async () => {
      const engine = await createUnlockedEngine();

      const longTitle = fc.string({ minLength: 257, maxLength: 300 });
      await fc.assert(
        fc.asyncProperty(longTitle, validPassword, async (title, pw) => {
          await expect(engine.addEntry({ title, password: pw })).rejects.toThrow(/Title/);
        }),
        { numRuns: 5 }
      );
    });
  });

  // ─── Property 3: Entry edit round-trip (Task 4.7) ───────────────────────────
  describe('Property 3: Entry edit round-trip', () => {
    it('editing a field and reading back returns the new value', async () => {
      const engine = await createUnlockedEngine();
      const meta = await engine.addEntry({ title: 'Base', password: 'base-pw' });

      await fc.assert(
        fc.asyncProperty(validTitle, async (newTitle) => {
          await engine.editEntry(meta.uuid, { title: newTitle });
          const entry = engine.getEntry(meta.uuid);
          expect(entry.title).toBe(newTitle);
        }),
        { numRuns: 10 }
      );
    });

    it('modification timestamp advances on each edit', async () => {
      const engine = await createUnlockedEngine();
      const meta = await engine.addEntry({ title: 'TimeTest', password: 'pw' });

      let prevTime = engine.getEntry(meta.uuid).modifiedAt;

      await fc.assert(
        fc.asyncProperty(validTitle, async (newTitle) => {
          await new Promise((r) => setTimeout(r, 10)); // tiny delay for timestamp change
          await engine.editEntry(meta.uuid, { title: newTitle });
          const current = engine.getEntry(meta.uuid).modifiedAt;
          expect(current >= prevTime).toBe(true);
          prevTime = current;
        }),
        { numRuns: 5 }
      );
    });
  });

  // ─── Property 4: Delete correctness (Task 4.8) ─────────────────────────────
  describe('Property 4: Delete correctness', () => {
    it('deleting an entry removes it from listEntries', async () => {
      const engine = await createUnlockedEngine();

      await fc.assert(
        fc.asyncProperty(validTitle, validPassword, async (title, pw) => {
          const meta = await engine.addEntry({ title, password: pw });
          const beforeCount = engine.listEntries().length;

          await engine.deleteEntry(meta.uuid);

          const afterCount = engine.listEntries().length;
          expect(afterCount).toBe(beforeCount - 1);

          // Entry is no longer findable
          expect(() => engine.getEntry(meta.uuid)).toThrow(/not found/);
        }),
        { numRuns: 5 }
      );
    });
  });

  // ─── Property 5: Lock invariant (Task 4.9) ─────────────────────────────────
  describe('Property 5: Lock invariant', () => {
    it('after lock, no entry data is accessible', async () => {
      const engine = await createUnlockedEngine();

      await fc.assert(
        fc.asyncProperty(validEntryInput, async (input) => {
          const meta = await engine.addEntry(input);
          engine.lock();

          // All access methods throw
          expect(() => engine.getEntry(meta.uuid)).toThrow(/locked/i);
          expect(() => engine.listEntries()).toThrow(/locked/i);
          expect(engine.isUnlocked()).toBe(false);

          // Restore for next iteration
          await engine.unlock('property-test-pw');
        }),
        { numRuns: 5 }
      );
    });
  });

  // ─── Property 6: Lock-unlock round-trip (Task 4.10) ────────────────────────
  describe('Property 6: Lock-unlock round-trip', () => {
    it('entries are fully restored after lock followed by unlock', async () => {
      const engine = await createUnlockedEngine();

      await fc.assert(
        fc.asyncProperty(validEntryInput, async (input) => {
          const meta = await engine.addEntry(input);

          engine.lock();
          await engine.unlock('property-test-pw');

          const entry = engine.getEntry(meta.uuid);
          expect(entry.title).toBe(input.title);
          expect(entry.password).toBe(input.password);
          expect(entry.favorite).toBe(input.favorite || false);
        }),
        { numRuns: 5 }
      );
    });
  });

  // ─── Property 7: Brute-force delay enforcement (Task 4.11) ─────────────────
  describe('Property 7: Brute-force delay enforcement', () => {
    it('failed unlock attempts increment the counter', async () => {
      const engine = await createUnlockedEngine();
      engine.lock();

      // Each wrong password increments
      const wrongPasswords = ['wrong1', 'wrong2', 'wrong3'];
      for (let i = 0; i < wrongPasswords.length; i++) {
        await expect(engine.unlock(wrongPasswords[i])).rejects.toThrow('Incorrect password');
        expect(engine.getBruteForceState().failedAttempts).toBe(i + 1);
      }
    });

    it('successful unlock resets the counter to zero', async () => {
      const engine = await createUnlockedEngine();
      engine.lock();

      // Fail twice
      await expect(engine.unlock('wrong')).rejects.toThrow();
      await expect(engine.unlock('wrong')).rejects.toThrow();
      expect(engine.getBruteForceState().failedAttempts).toBe(2);

      // Succeed
      await engine.unlock('property-test-pw');
      expect(engine.getBruteForceState().failedAttempts).toBe(0);
    });

    it('after 5 failures, cooldown is activated', async () => {
      const engine = await createUnlockedEngine();
      engine.lock();

      for (let i = 0; i < 5; i++) {
        await expect(engine.unlock('wrong')).rejects.toThrow();
      }

      const state = engine.getBruteForceState();
      expect(state.failedAttempts).toBe(5);
      expect(state.cooldownUntil).toBeGreaterThan(Date.now());

      // Next attempt rejected immediately with cooldown message
      await expect(engine.unlock('property-test-pw')).rejects.toThrow(/wait.*seconds/i);
    });
  });
});
