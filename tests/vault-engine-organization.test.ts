// @vitest-environment node
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeAll } from 'vitest';
import { vi } from 'vitest';
import * as kdbxweb from 'kdbxweb';

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
  await engine.create('test-password', 'OrgTestVault');
  return { engine, storage };
}

describe('VaultEngine Organization (Task 4.4)', { timeout: 30_000 }, () => {
  beforeAll(async () => {
    await registerTestArgon2();
  });

  // ─── Categories (KDBX Groups) ───────────────────────────────────────────────

  describe('createCategory()', () => {
    it('should create a KDBX group', async () => {
      const { engine } = await createUnlockedEngine();

      await engine.createCategory('Work');
      const categories = engine.getCategories();
      expect(categories).toContain('Work');
    });

    it('should reject duplicate category name', async () => {
      const { engine } = await createUnlockedEngine();

      await engine.createCategory('Personal');
      await expect(engine.createCategory('Personal')).rejects.toThrow(/already exists/);
    });

    it('should reject empty name', async () => {
      const { engine } = await createUnlockedEngine();
      await expect(engine.createCategory('')).rejects.toThrow(/required/);
    });

    it('should reject name exceeding 64 characters', async () => {
      const { engine } = await createUnlockedEngine();
      await expect(engine.createCategory('a'.repeat(65))).rejects.toThrow(/at most/);
    });

    it('should enforce max 50 categories', async () => {
      const { engine } = await createUnlockedEngine();

      for (let i = 0; i < 50; i++) {
        await engine.createCategory(`Category-${i}`);
      }
      await expect(engine.createCategory('One More')).rejects.toThrow(/Maximum 50/);
    });
  });

  describe('renameCategory()', () => {
    it('should rename a group', async () => {
      const { engine } = await createUnlockedEngine();

      await engine.createCategory('OldName');
      await engine.renameCategory('OldName', 'NewName');

      const categories = engine.getCategories();
      expect(categories).toContain('NewName');
      expect(categories).not.toContain('OldName');
    });

    it('should reject if old name not found', async () => {
      const { engine } = await createUnlockedEngine();
      await expect(engine.renameCategory('Ghost', 'Real')).rejects.toThrow(/not found/);
    });

    it('should reject if new name already exists', async () => {
      const { engine } = await createUnlockedEngine();

      await engine.createCategory('Alpha');
      await engine.createCategory('Beta');
      await expect(engine.renameCategory('Alpha', 'Beta')).rejects.toThrow(/already exists/);
    });

    it('should allow renaming to the same name (no-op)', async () => {
      const { engine } = await createUnlockedEngine();

      await engine.createCategory('Same');
      await expect(engine.renameCategory('Same', 'Same')).resolves.not.toThrow();
    });
  });

  describe('deleteCategory()', () => {
    it('should delete the group and move entries to root', async () => {
      const { engine } = await createUnlockedEngine();

      await engine.createCategory('ToDelete');
      const meta = await engine.addEntry({ title: 'InGroup', password: 'pw' });
      await engine.setCategory(meta.uuid, 'ToDelete');

      // Verify entry is in the category
      expect(engine.getEntry(meta.uuid).category).toBe('ToDelete');

      await engine.deleteCategory('ToDelete');

      // Category gone
      expect(engine.getCategories()).not.toContain('ToDelete');
      // Entry moved to root (uncategorized)
      expect(engine.getEntry(meta.uuid).category).toBeNull();
      // Entry still exists
      expect(engine.listEntries().length).toBe(1);
    });

    it('should reject if category not found', async () => {
      const { engine } = await createUnlockedEngine();
      await expect(engine.deleteCategory('Nope')).rejects.toThrow(/not found/);
    });
  });

  describe('setCategory()', () => {
    it('should move entry to the target group', async () => {
      const { engine } = await createUnlockedEngine();

      await engine.createCategory('Work');
      const meta = await engine.addEntry({ title: 'GitHub', password: 'pw' });

      await engine.setCategory(meta.uuid, 'Work');

      const entry = engine.getEntry(meta.uuid);
      expect(entry.category).toBe('Work');
    });

    it('should move entry to root when category is null', async () => {
      const { engine } = await createUnlockedEngine();

      await engine.createCategory('Temp');
      const meta = await engine.addEntry({ title: 'MovingEntry', password: 'pw' });
      await engine.setCategory(meta.uuid, 'Temp');
      expect(engine.getEntry(meta.uuid).category).toBe('Temp');

      await engine.setCategory(meta.uuid, null);
      expect(engine.getEntry(meta.uuid).category).toBeNull();
    });

    it('should reject if entry not found', async () => {
      const { engine } = await createUnlockedEngine();
      await engine.createCategory('X');
      await expect(engine.setCategory('fake-id', 'X')).rejects.toThrow(/not found/);
    });

    it('should reject if category does not exist', async () => {
      const { engine } = await createUnlockedEngine();
      const meta = await engine.addEntry({ title: 'E', password: 'p' });
      await expect(engine.setCategory(meta.uuid, 'Nonexistent')).rejects.toThrow(/not found/);
    });

    it('entries persist category after lock/unlock', async () => {
      const { engine } = await createUnlockedEngine();

      await engine.createCategory('Banking');
      const meta = await engine.addEntry({ title: 'Account', password: 'pw' });
      await engine.setCategory(meta.uuid, 'Banking');

      engine.lock();
      await engine.unlock('test-password');

      const entry = engine.getEntry(meta.uuid);
      expect(entry.category).toBe('Banking');
      expect(engine.getCategories()).toContain('Banking');
    });
  });

  describe('getCategories()', () => {
    it('should return all groups except recycle bin', async () => {
      const { engine } = await createUnlockedEngine();

      await engine.createCategory('A');
      await engine.createCategory('B');
      await engine.createCategory('C');

      const categories = engine.getCategories();
      expect(categories.sort()).toEqual(['A', 'B', 'C']);
    });

    it('should not include the default root group', async () => {
      const { engine } = await createUnlockedEngine();

      const categories = engine.getCategories();
      expect(categories.length).toBe(0);
    });
  });

  // ─── Tags ───────────────────────────────────────────────────────────────────

  describe('createTag()', () => {
    it('should register a new tag', async () => {
      const { engine } = await createUnlockedEngine();

      await engine.createTag('important');
      expect(engine.getTags()).toContain('important');
    });

    it('should reject duplicate tag', async () => {
      const { engine } = await createUnlockedEngine();

      await engine.createTag('dev');
      await expect(engine.createTag('dev')).rejects.toThrow(/already exists/);
    });

    it('should reject empty name', async () => {
      const { engine } = await createUnlockedEngine();
      await expect(engine.createTag('')).rejects.toThrow(/required/);
    });

    it('should enforce max 100 tags', async () => {
      const { engine } = await createUnlockedEngine();

      for (let i = 0; i < 100; i++) {
        await engine.createTag(`tag-${i}`);
      }
      await expect(engine.createTag('overflow')).rejects.toThrow(/Maximum 100/);
    });
  });

  describe('deleteTag()', () => {
    it('should remove the tag from registry', async () => {
      const { engine } = await createUnlockedEngine();

      await engine.createTag('temp');
      await engine.deleteTag('temp');
      expect(engine.getTags()).not.toContain('temp');
    });

    it('should cascade-remove from all entries with that tag', async () => {
      const { engine } = await createUnlockedEngine();

      await engine.createTag('cleanup');
      const meta1 = await engine.addEntry({ title: 'E1', password: 'p', tags: ['cleanup', 'keep'] });
      const meta2 = await engine.addEntry({ title: 'E2', password: 'p', tags: ['cleanup'] });

      await engine.deleteTag('cleanup');

      expect(engine.getEntry(meta1.uuid).tags).toEqual(['keep']);
      expect(engine.getEntry(meta2.uuid).tags).toEqual([]);
    });

    it('should reject if tag not found', async () => {
      const { engine } = await createUnlockedEngine();
      await expect(engine.deleteTag('nope')).rejects.toThrow(/not found/);
    });
  });

  describe('setTags()', () => {
    it('should set tags on an entry', async () => {
      const { engine } = await createUnlockedEngine();

      const meta = await engine.addEntry({ title: 'Tagged', password: 'pw' });
      await engine.setTags(meta.uuid, ['alpha', 'beta']);

      const entry = engine.getEntry(meta.uuid);
      expect(entry.tags).toEqual(['alpha', 'beta']);
    });

    it('should replace existing tags', async () => {
      const { engine } = await createUnlockedEngine();

      const meta = await engine.addEntry({ title: 'Replace', password: 'pw', tags: ['old'] });
      await engine.setTags(meta.uuid, ['new1', 'new2']);

      expect(engine.getEntry(meta.uuid).tags).toEqual(['new1', 'new2']);
    });

    it('should reject more than 20 tags', async () => {
      const { engine } = await createUnlockedEngine();

      const meta = await engine.addEntry({ title: 'TooMany', password: 'pw' });
      const tags = Array.from({ length: 21 }, (_, i) => `t${i}`);
      await expect(engine.setTags(meta.uuid, tags)).rejects.toThrow(/Maximum/);
    });

    it('should reject tag exceeding 64 characters', async () => {
      const { engine } = await createUnlockedEngine();

      const meta = await engine.addEntry({ title: 'LongTag', password: 'pw' });
      await expect(engine.setTags(meta.uuid, ['a'.repeat(65)])).rejects.toThrow(/at most/);
    });
  });

  describe('getTags()', () => {
    it('should return all registered tags', async () => {
      const { engine } = await createUnlockedEngine();

      await engine.createTag('x');
      await engine.createTag('y');
      await engine.createTag('z');

      expect(engine.getTags().sort()).toEqual(['x', 'y', 'z']);
    });

    it('should persist after lock/unlock', async () => {
      const { engine } = await createUnlockedEngine();

      await engine.createTag('persistent-tag');

      engine.lock();
      await engine.unlock('test-password');

      expect(engine.getTags()).toContain('persistent-tag');
    });
  });

  // ─── Favorites ──────────────────────────────────────────────────────────────

  describe('setFavorite()', () => {
    it('should mark entry as favorite', async () => {
      const { engine } = await createUnlockedEngine();

      const meta = await engine.addEntry({ title: 'Fav', password: 'pw' });
      await engine.setFavorite(meta.uuid, true);

      expect(engine.getEntry(meta.uuid).favorite).toBe(true);
      expect(engine.listEntries()[0].favorite).toBe(true);
    });

    it('should unmark favorite', async () => {
      const { engine } = await createUnlockedEngine();

      const meta = await engine.addEntry({ title: 'Fav', password: 'pw', favorite: true });
      await engine.setFavorite(meta.uuid, false);

      expect(engine.getEntry(meta.uuid).favorite).toBe(false);
    });

    it('should reject if entry not found', async () => {
      const { engine } = await createUnlockedEngine();
      await expect(engine.setFavorite('fake', true)).rejects.toThrow(/not found/);
    });

    it('should persist after lock/unlock', async () => {
      const { engine } = await createUnlockedEngine();

      const meta = await engine.addEntry({ title: 'PersistFav', password: 'pw' });
      await engine.setFavorite(meta.uuid, true);

      engine.lock();
      await engine.unlock('test-password');

      expect(engine.getEntry(meta.uuid).favorite).toBe(true);
    });
  });
});
