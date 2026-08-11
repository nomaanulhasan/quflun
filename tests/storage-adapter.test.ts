import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageAdapterImpl } from '@/lib/storage/storage-adapter';
import { DB_NAME } from '@/lib/storage/schema';
import type { AppSettings } from '@/types';
import { DEFAULT_SHORTCUTS } from '@/stores/ui-store';

let adapter: StorageAdapterImpl;

/**
 * Reset indexedDB between tests by closing the connection and deleting the database.
 */
beforeEach(async () => {
  if (adapter) {
    await adapter._reset();
  }
  // Delete the database to start fresh
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  adapter = new StorageAdapterImpl();
});

describe('StorageAdapter', () => {
  describe('saveVault / loadVault round-trip', () => {
    it('should save and load vault data', async () => {
      const id = crypto.randomUUID();
      const name = 'Test Vault';
      const data = new TextEncoder().encode('encrypted-vault-data').buffer as ArrayBuffer;

      await adapter.saveVault(id, name, data);
      const loaded = await adapter.loadVault(id);

      expect(loaded).not.toBeNull();
      const decoded = new TextDecoder().decode(new Uint8Array(loaded!));
      expect(decoded).toBe('encrypted-vault-data');
    });

    it('should return null for non-existent vault', async () => {
      const loaded = await adapter.loadVault('non-existent-id');
      expect(loaded).toBeNull();
    });
  });

  describe('listVaults', () => {
    it('should return all stored vaults', async () => {
      const id1 = crypto.randomUUID();
      const id2 = crypto.randomUUID();
      const data = new TextEncoder().encode('data').buffer as ArrayBuffer;

      await adapter.saveVault(id1, 'Vault 1', data);
      await adapter.saveVault(id2, 'Vault 2', data);

      const vaults = await adapter.listVaults();
      expect(vaults.length).toBe(2);

      const names = vaults.map((v) => v.name).sort();
      expect(names).toEqual(['Vault 1', 'Vault 2']);

      // Each vault should have id, name, and lastOpened
      for (const vault of vaults) {
        expect(vault.id).toBeDefined();
        expect(vault.name).toBeDefined();
        expect(vault.lastOpened).toBeDefined();
        expect(new Date(vault.lastOpened).toISOString()).toBe(vault.lastOpened);
      }
    });

    it('should return empty array when no vaults exist', async () => {
      const vaults = await adapter.listVaults();
      expect(vaults.length).toBe(0);
    });
  });

  describe('deleteVault', () => {
    it('should remove only the target vault', async () => {
      const id1 = crypto.randomUUID();
      const id2 = crypto.randomUUID();
      const data = new TextEncoder().encode('data').buffer as ArrayBuffer;

      await adapter.saveVault(id1, 'Vault 1', data);
      await adapter.saveVault(id2, 'Vault 2', data);

      await adapter.deleteVault(id1);

      const vaults = await adapter.listVaults();
      expect(vaults.length).toBe(1);
      expect(vaults[0].id).toBe(id2);
      expect(vaults[0].name).toBe('Vault 2');

      // Verify deleted vault is gone
      const loaded = await adapter.loadVault(id1);
      expect(loaded).toBeNull();
    });

    it('should not throw when deleting non-existent vault', async () => {
      await expect(adapter.deleteVault('non-existent')).resolves.not.toThrow();
    });
  });

  describe('settings save/load', () => {
    it('should save and load settings', async () => {
      const settings: AppSettings = {
        idleTimeoutMinutes: 10,
        clipboardTimeoutSeconds: 45,
        backupReminderDays: 14,
        lastBackupDate: null,
        theme: 'dark',
        shortcuts: { ...DEFAULT_SHORTCUTS },
      };

      await adapter.saveSettings(settings);
      const loaded = await adapter.getSettings();

      expect(loaded).toEqual(settings);
    });

    it('should return null when no settings exist', async () => {
      const loaded = await adapter.getSettings();
      expect(loaded).toBeNull();
    });

    it('should overwrite existing settings', async () => {
      const initial: AppSettings = {
        idleTimeoutMinutes: 5,
        clipboardTimeoutSeconds: 30,
        backupReminderDays: 30,
        lastBackupDate: null,
        theme: 'system',
        shortcuts: { ...DEFAULT_SHORTCUTS },
      };

      const updated: AppSettings = {
        idleTimeoutMinutes: 15,
        clipboardTimeoutSeconds: 60,
        backupReminderDays: 7,
        lastBackupDate: '2024-01-15T10:00:00.000Z',
        theme: 'light',
        shortcuts: { ...DEFAULT_SHORTCUTS },
      };

      await adapter.saveSettings(initial);
      await adapter.saveSettings(updated);
      const loaded = await adapter.getSettings();

      expect(loaded).toEqual(updated);
    });
  });

  describe('no localStorage/sessionStorage usage', () => {
    it('should not use localStorage', async () => {
      const spy = vi.spyOn(Storage.prototype, 'setItem');
      const data = new TextEncoder().encode('data').buffer as ArrayBuffer;

      await adapter.saveVault(crypto.randomUUID(), 'Test', data);
      await adapter.listVaults();
      await adapter.saveSettings({
        idleTimeoutMinutes: 5,
        clipboardTimeoutSeconds: 30,
        backupReminderDays: 30,
        lastBackupDate: null,
        theme: 'system',
        shortcuts: { ...DEFAULT_SHORTCUTS },
      });

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
