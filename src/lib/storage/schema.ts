import { DBSchema } from 'idb';

export interface QuflDB extends DBSchema {
  vaults: {
    key: string;
    value: {
      id: string;
      name: string;
      data: ArrayBuffer;
      lastOpened: string; // ISO 8601
    };
  };
  settings: {
    key: string;
    value: {
      key: string;
      idleTimeoutMinutes: number;
      clipboardTimeoutSeconds: number;
      backupReminderDays: number;
      lastBackupDate: string | null;
      theme: 'light' | 'dark' | 'system';
    };
  };
}

export const DB_NAME = 'qufly-db';
export const DB_VERSION = 1;
