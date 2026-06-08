import { openDB, IDBPDatabase } from 'idb';
import type { AppSettings, VaultMeta } from '@/types';
import { QuflDB, DB_NAME, DB_VERSION } from './schema';

/**
 * Interface for persistent storage operations using IndexedDB.
 * Note: saveVault includes `name` parameter because the IndexedDB record
 * stores vault metadata alongside the encrypted blob. The VaultEngine (Task 4)
 * is responsible for providing the name on create and re-save operations.
 */
export interface StorageAdapter {
  saveVault(id: string, name: string, data: ArrayBuffer): Promise<void>;
  loadVault(id: string): Promise<ArrayBuffer | null>;
  deleteVault(id: string): Promise<void>;
  listVaults(): Promise<VaultMeta[]>;
  getSettings(): Promise<AppSettings | null>;
  saveSettings(settings: AppSettings): Promise<void>;
}

/**
 * Implementation of the StorageAdapter interface using IndexedDB via idb.
 */
export class StorageAdapterImpl implements StorageAdapter {
  private dbPromise: Promise<IDBPDatabase<QuflDB>> | null = null;

  private getDb(): Promise<IDBPDatabase<QuflDB>> {
    if (!this.dbPromise) {
      // H-4 fix: Null the cached promise on rejection so subsequent calls can retry
      this.dbPromise = openDB<QuflDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('vaults')) {
            db.createObjectStore('vaults', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
          }
        },
      }).catch((err) => {
        this.dbPromise = null;
        throw err;
      });
    }
    return this.dbPromise;
  }

  /** Close the database connection and reset internal state (for testing) */
  async _reset(): Promise<void> {
    if (this.dbPromise) {
      const db = await this.dbPromise;
      db.close();
      this.dbPromise = null;
    }
  }

  async saveVault(id: string, name: string, data: ArrayBuffer): Promise<void> {
    const db = await this.getDb();
    await db.put('vaults', {
      id,
      name,
      data,
      lastOpened: new Date().toISOString(),
    });
  }

  async loadVault(id: string): Promise<ArrayBuffer | null> {
    const db = await this.getDb();
    const record = await db.get('vaults', id);
    return record?.data ?? null;
  }

  async deleteVault(id: string): Promise<void> {
    const db = await this.getDb();
    await db.delete('vaults', id);
  }

  async listVaults(): Promise<VaultMeta[]> {
    const db = await this.getDb();
    const all = await db.getAll('vaults');
    return all.map(({ id, name, lastOpened }) => ({ id, name, lastOpened }));
  }

  async getSettings(): Promise<AppSettings | null> {
    const db = await this.getDb();
    const record = await db.get('settings', 'app-settings');
    if (!record) return null;
    const { key: _key, ...settings } = record;
    return settings as AppSettings;
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    const db = await this.getDb();
    await db.put('settings', { key: 'app-settings', ...settings });
  }
}

/** Singleton storage adapter instance */
export const storageAdapter: StorageAdapter = new StorageAdapterImpl();
