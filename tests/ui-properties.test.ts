// @vitest-environment node
/**
 * Property-based tests for UI layer (Tasks 12.6–12.7)
 * Tests category/tag/favorite behaviors via the VaultEngine.
 */
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeAll } from 'vitest';
import { vi } from 'vitest';
import * as fc from 'fast-check';
import * as kdbxweb from 'kdbxweb';

vi.mock('@/lib/crypto/argon2-init', () => ({
  initArgon2: vi.fn().mockResolvedValue(undefined),
}));

async function registerTestArgon2(): Promise<void> {
  const { createHash } = await import('node:crypto');
  kdbxweb.CryptoEngine.setArgon2Impl(async (pw, salt, _m, _i, len) => {
    const h = createHash('sha512');
    h.update(new Uint8Array(pw));
    h.update(new Uint8Array(salt));
    const r = h.digest();
    const out = new Uint8Array(len);
    out.set(r.subarray(0, Math.min(r.length, len)));
    return out.buffer as ArrayBuffer;
  });
}

async function createEngine() {
  const { cryptoAdapter } = await import('@/lib/crypto/crypto-adapter');
  const { StorageAdapterImpl } = await import('@/lib/storage/storage-adapter');
  const { createVaultEngine } = await import('@/lib/vault-engine/vault-engine');
  const storage = new StorageAdapterImpl();
  const engine = createVaultEngine(cryptoAdapter, storage);
  await engine.create('test-pw', 'PropVault');
  return engine;
}

describe(
  'Property 17–22: Categories, Tags, Favorites, Notes (Tasks 12.6–12.7)',
  { timeout: 60_000 },
  () => {
    beforeAll(async () => {
      await registerTestArgon2();
    });

    // Property 17: Category single assignment
    describe('Property 17: Category single assignment', () => {
      it('assigning a category replaces previous category', async () => {
        const engine = await createEngine();
        await engine.createCategory('A');
        await engine.createCategory('B');
        const meta = await engine.addEntry({ title: 'E', password: 'p' });

        await engine.setCategory(meta.uuid, 'A');
        expect(engine.getEntry(meta.uuid).category).toBe('A');

        await engine.setCategory(meta.uuid, 'B');
        expect(engine.getEntry(meta.uuid).category).toBe('B');
      });
    });

    // Property 18: Tag assignment with limits
    describe('Property 18: Tag assignment with limits', () => {
      it('rejects more than 20 tags per entry', async () => {
        const engine = await createEngine();
        const meta = await engine.addEntry({ title: 'E', password: 'p' });
        const tags = Array.from({ length: 21 }, (_, i) => `t${i}`);
        await expect(engine.setTags(meta.uuid, tags)).rejects.toThrow(/Maximum/);
      });

      it('accepts up to 20 tags', async () => {
        const engine = await createEngine();
        const meta = await engine.addEntry({ title: 'E', password: 'p' });
        const tags = Array.from({ length: 20 }, (_, i) => `tag${i}`);
        await engine.setTags(meta.uuid, tags);
        expect(engine.getEntry(meta.uuid).tags.length).toBe(20);
      });
    });

    // Property 19: Filter correctness
    describe('Property 19: Filter correctness', () => {
      it('entries in a category are listed with that category', async () => {
        const engine = await createEngine();
        await engine.createCategory('Work');
        const m1 = await engine.addEntry({ title: 'A', password: 'p' });
        const m2 = await engine.addEntry({ title: 'B', password: 'p' });
        await engine.setCategory(m1.uuid, 'Work');

        const list = engine.listEntries();
        const workEntries = list.filter((e) => e.category === 'Work');
        const rootEntries = list.filter((e) => e.category === null);

        expect(workEntries.length).toBe(1);
        expect(workEntries[0].uuid).toBe(m1.uuid);
        expect(rootEntries.some((e) => e.uuid === m2.uuid)).toBe(true);
      });
    });

    // Property 20: Category and tag uniqueness
    describe('Property 20: Uniqueness constraint', () => {
      it('rejects duplicate category names', async () => {
        const engine = await createEngine();
        await engine.createCategory('Dup');
        await expect(engine.createCategory('Dup')).rejects.toThrow(/already exists/);
      });

      it('rejects duplicate tag names', async () => {
        const engine = await createEngine();
        await engine.createTag('dup');
        await expect(engine.createTag('dup')).rejects.toThrow(/already exists/);
      });

      it('rejects renaming category to existing name', async () => {
        const engine = await createEngine();
        await engine.createCategory('X');
        await engine.createCategory('Y');
        await expect(engine.renameCategory('X', 'Y')).rejects.toThrow(/already exists/);
      });
    });

    // Property 21: Cascade deletion
    describe('Property 21: Cascade deletion', () => {
      it('deleting a category moves entries to uncategorized', async () => {
        const engine = await createEngine();
        await engine.createCategory('Temp');
        const meta = await engine.addEntry({ title: 'E', password: 'p' });
        await engine.setCategory(meta.uuid, 'Temp');

        await engine.deleteCategory('Temp');
        expect(engine.getEntry(meta.uuid).category).toBeNull();
        expect(engine.getCategories()).not.toContain('Temp');
      });

      it('deleting a tag removes it from all entries', async () => {
        const engine = await createEngine();
        await engine.createTag('rmtag');
        const m1 = await engine.addEntry({ title: 'A', password: 'p', tags: ['rmtag', 'keep'] });
        const m2 = await engine.addEntry({ title: 'B', password: 'p', tags: ['rmtag'] });

        await engine.deleteTag('rmtag');
        expect(engine.getEntry(m1.uuid).tags).toEqual(['keep']);
        expect(engine.getEntry(m2.uuid).tags).toEqual([]);
        expect(engine.getTags()).not.toContain('rmtag');
      });
    });

    // Property 16: Secure note round-trip
    describe('Property 16: Secure note round-trip', () => {
      it('note body persists through add/lock/unlock cycle', async () => {
        const engine = await createEngine();

        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 1, maxLength: 100 }),
            fc.string({ minLength: 1, maxLength: 200 }),
            async (title, body) => {
              const meta = await engine.addNote({ title, body });
              engine.lock();
              await engine.unlock('test-pw');
              const entry = engine.getEntry(meta.uuid);
              expect(entry.type).toBe('note');
              expect(entry.title).toBe(title);
              expect(entry.notes).toBe(body); // body stored in notes field
            }
          ),
          { numRuns: 5 }
        );
      });
    });

    // Property 22: Favorites view correctness
    describe('Property 22: Favorites view correctness', () => {
      it('only favorited entries appear when filtering favorites', async () => {
        const engine = await createEngine();
        const m1 = await engine.addEntry({ title: 'Fav', password: 'p', favorite: true });
        const m2 = await engine.addEntry({ title: 'NotFav', password: 'p', favorite: false });

        const all = engine.listEntries();
        const favs = all.filter((e) => e.favorite);

        expect(favs.length).toBe(1);
        expect(favs[0].uuid).toBe(m1.uuid);
      });

      it('toggling favorite updates list view', async () => {
        const engine = await createEngine();
        const meta = await engine.addEntry({ title: 'Toggle', password: 'p' });

        expect(engine.listEntries().find((e) => e.uuid === meta.uuid)?.favorite).toBe(false);

        await engine.setFavorite(meta.uuid, true);
        expect(engine.listEntries().find((e) => e.uuid === meta.uuid)?.favorite).toBe(true);

        await engine.setFavorite(meta.uuid, false);
        expect(engine.listEntries().find((e) => e.uuid === meta.uuid)?.favorite).toBe(false);
      });
    });
  }
);
