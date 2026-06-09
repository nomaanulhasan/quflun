// @vitest-environment node
/**
 * Tests for Vault Store and UI Store (Tasks 10.1, 10.2, 10.3)
 */
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import * as kdbxweb from 'kdbxweb';
import * as fs from 'fs';
import * as path from 'path';

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

async function createTestVaultStore() {
  const { cryptoAdapter } = await import('@/lib/crypto/crypto-adapter');
  const { StorageAdapterImpl } = await import('@/lib/storage/storage-adapter');
  const { createVaultEngine } = await import('@/lib/vault-engine/vault-engine');
  const { createVaultStore } = await import('@/stores/vault-store');

  const storage = new StorageAdapterImpl();
  const engine = createVaultEngine(cryptoAdapter, storage);
  const useStore = createVaultStore(engine);
  return { useStore, engine, storage };
}

async function createTestUIStore() {
  const { StorageAdapterImpl } = await import('@/lib/storage/storage-adapter');
  const { createUIStore } = await import('@/stores/ui-store');

  const storage = new StorageAdapterImpl();
  const useStore = createUIStore(storage);
  return { useStore, storage };
}

describe('Vault Store (Task 10.1)', { timeout: 30_000 }, () => {
  beforeAll(async () => {
    await registerTestArgon2();
  });

  describe('initial state', () => {
    it('should start locked with empty entries', async () => {
      const { useStore } = await createTestVaultStore();
      const state = useStore.getState();

      expect(state.status).toBe('locked');
      expect(state.entries).toEqual([]);
      expect(state.vaultId).toBeNull();
      expect(state.vaultName).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe('create()', () => {
    it('should set status to unlocked with vault metadata', async () => {
      const { useStore } = await createTestVaultStore();

      await useStore.getState().create('password123', 'TestVault');

      const state = useStore.getState();
      expect(state.status).toBe('unlocked');
      expect(state.vaultId).toBeTruthy();
      expect(state.vaultName).toBe('TestVault');
      expect(state.entries).toEqual([]); // new vault = no entries
    });
  });

  describe('lock clears all state', () => {
    it('should clear entries and set status to locked', async () => {
      const { useStore } = await createTestVaultStore();

      await useStore.getState().create('pw', 'LockTest');
      await useStore.getState().addEntry({ title: 'Entry', password: 'pw' });

      expect(useStore.getState().entries.length).toBe(1);

      useStore.getState().lock();

      const state = useStore.getState();
      expect(state.status).toBe('locked');
      expect(state.entries).toEqual([]);
      expect(state.error).toBeNull();
    });

    it('should preserve vaultId for unlock', async () => {
      const { useStore } = await createTestVaultStore();

      await useStore.getState().create('pw', 'VaultIdTest');
      const vaultId = useStore.getState().vaultId;

      useStore.getState().lock();

      expect(useStore.getState().vaultId).toBe(vaultId);
    });
  });

  describe('unlock populates entries', () => {
    it('should restore entries after lock + unlock', async () => {
      const { useStore } = await createTestVaultStore();

      await useStore.getState().create('my-pw', 'UnlockTest');
      await useStore.getState().addEntry({ title: 'Persistent', password: 'pw' });
      await useStore.getState().addEntry({ title: 'Another', password: 'pw2' });

      expect(useStore.getState().entries.length).toBe(2);

      useStore.getState().lock();
      expect(useStore.getState().entries).toEqual([]);

      await useStore.getState().unlock('my-pw');

      const state = useStore.getState();
      expect(state.status).toBe('unlocked');
      expect(state.entries.length).toBe(2);
    });
  });

  describe('entry CRUD updates store', () => {
    it('addEntry updates entries list', async () => {
      const { useStore } = await createTestVaultStore();
      await useStore.getState().create('pw', 'CrudStore');

      await useStore.getState().addEntry({ title: 'New', password: 'pw' });
      expect(useStore.getState().entries.length).toBe(1);
      expect(useStore.getState().entries[0].title).toBe('New');
    });

    it('deleteEntry removes from entries list', async () => {
      const { useStore } = await createTestVaultStore();
      await useStore.getState().create('pw', 'DeleteStore');

      const meta = await useStore.getState().addEntry({ title: 'ToRemove', password: 'pw' });
      expect(useStore.getState().entries.length).toBe(1);

      await useStore.getState().deleteEntry(meta.uuid);
      expect(useStore.getState().entries.length).toBe(0);
    });

    it('editEntry updates entry in list', async () => {
      const { useStore } = await createTestVaultStore();
      await useStore.getState().create('pw', 'EditStore');

      const meta = await useStore.getState().addEntry({ title: 'Original', password: 'pw' });
      await useStore.getState().editEntry(meta.uuid, { title: 'Updated' });

      expect(useStore.getState().entries[0].title).toBe('Updated');
    });
  });

  describe('no persist middleware', () => {
    it('store source code should not import persist from zustand', () => {
      const sourcePath = path.resolve(__dirname, '../src/stores/vault-store.ts');
      const source = fs.readFileSync(sourcePath, 'utf-8');
      // Should not import persist middleware
      expect(source).not.toMatch(/from\s+['"]zustand\/middleware['"]/);
      expect(source).not.toMatch(/persist\s*\(/);
    });
  });

  describe('no localStorage/sessionStorage usage', () => {
    it('store source code does not use Storage APIs', () => {
      const sourcePath = path.resolve(__dirname, '../src/stores/vault-store.ts');
      const source = fs.readFileSync(sourcePath, 'utf-8');
      // Remove comments before checking
      const codeOnly = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
      expect(codeOnly).not.toContain('localStorage.');
      expect(codeOnly).not.toContain('sessionStorage.');
    });
  });
});

describe('UI Store (Task 10.2)', { timeout: 30_000 }, () => {
  beforeAll(async () => {
    await registerTestArgon2();
  });

  describe('default settings', () => {
    it('should start with default settings', async () => {
      const { useStore } = await createTestUIStore();
      const { settings } = useStore.getState();

      expect(settings.idleTimeoutMinutes).toBe(5);
      expect(settings.clipboardTimeoutSeconds).toBe(30);
      expect(settings.backupReminderDays).toBe(30);
      expect(settings.lastBackupDate).toBeNull();
      expect(settings.theme).toBe('system');
    });
  });

  describe('loadSettings()', () => {
    it('should load saved settings from IndexedDB', async () => {
      const { useStore, storage } = await createTestUIStore();

      // Pre-save settings
      await storage.saveSettings({
        idleTimeoutMinutes: 15,
        clipboardTimeoutSeconds: 60,
        backupReminderDays: 7,
        lastBackupDate: '2024-06-01T00:00:00.000Z',
        theme: 'dark',
      });

      await useStore.getState().loadSettings();

      const { settings } = useStore.getState();
      expect(settings.idleTimeoutMinutes).toBe(15);
      expect(settings.clipboardTimeoutSeconds).toBe(60);
      expect(settings.theme).toBe('dark');
      expect(useStore.getState().settingsLoaded).toBe(true);
    });
  });

  describe('updateSettings()', () => {
    it('should update settings in store and persist to IndexedDB', async () => {
      const { useStore, storage } = await createTestUIStore();

      await useStore.getState().updateSettings({ theme: 'light', idleTimeoutMinutes: 10 });

      // Store updated
      expect(useStore.getState().settings.theme).toBe('light');
      expect(useStore.getState().settings.idleTimeoutMinutes).toBe(10);

      // IndexedDB persisted
      const saved = await storage.getSettings();
      expect(saved?.theme).toBe('light');
      expect(saved?.idleTimeoutMinutes).toBe(10);
    });

    it('should merge partial updates with existing settings', async () => {
      const { useStore } = await createTestUIStore();

      await useStore.getState().updateSettings({ theme: 'dark' });
      await useStore.getState().updateSettings({ idleTimeoutMinutes: 20 });

      const { settings } = useStore.getState();
      expect(settings.theme).toBe('dark');
      expect(settings.idleTimeoutMinutes).toBe(20);
      expect(settings.clipboardTimeoutSeconds).toBe(30); // unchanged
    });
  });

  describe('no persist middleware', () => {
    it('store source code should not import persist from zustand', () => {
      const sourcePath = path.resolve(__dirname, '../src/stores/ui-store.ts');
      const source = fs.readFileSync(sourcePath, 'utf-8');
      expect(source).not.toMatch(/from\s+['"]zustand\/middleware['"]/);
      expect(source).not.toMatch(/persist\s*\(/);
      // Remove comments before checking Storage APIs
      const codeOnly = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
      expect(codeOnly).not.toContain('localStorage.');
      expect(codeOnly).not.toContain('sessionStorage.');
    });
  });

  describe('sidebar state', () => {
    it('should toggle sidebar open state', async () => {
      const { useStore } = await createTestUIStore();

      expect(useStore.getState().sidebarOpen).toBe(false);

      useStore.getState().setSidebarOpen(true);
      expect(useStore.getState().sidebarOpen).toBe(true);

      useStore.getState().setSidebarOpen(false);
      expect(useStore.getState().sidebarOpen).toBe(false);
    });
  });
});
