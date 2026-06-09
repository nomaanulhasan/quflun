/**
 * UI Store — Zustand store for non-sensitive application settings.
 *
 * CRITICAL CONSTRAINTS:
 * - NO persist middleware
 * - NO localStorage / sessionStorage
 * - Settings persisted ONLY via manual StorageAdapter.saveSettings() to IndexedDB
 * - Settings loaded imperatively on app start via StorageAdapter.getSettings()
 */
import { create } from 'zustand';
import type { AppSettings } from '@/types';
import type { StorageAdapter } from '@/lib/storage';

// ─── Defaults ──────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: AppSettings = {
  idleTimeoutMinutes: 5,
  clipboardTimeoutSeconds: 30,
  backupReminderDays: 30,
  lastBackupDate: null,
  theme: 'system',
};

// ─── State Types ───────────────────────────────────────────────────────────────

export interface UIState {
  settings: AppSettings;
  sidebarOpen: boolean;
  settingsLoaded: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  setSidebarOpen: (open: boolean) => void;
}

// ─── Store Factory ─────────────────────────────────────────────────────────────

/**
 * Creates the UI store wired to a StorageAdapter for IndexedDB persistence.
 */
export function createUIStore(storageAdapter: StorageAdapter) {
  return create<UIState>((set, get) => ({
    settings: { ...DEFAULT_SETTINGS },
    sidebarOpen: false,
    settingsLoaded: false,

    async loadSettings() {
      const saved = await storageAdapter.getSettings();
      set({
        settings: saved ?? { ...DEFAULT_SETTINGS },
        settingsLoaded: true,
      });
    },

    async updateSettings(partial: Partial<AppSettings>) {
      const next = { ...get().settings, ...partial };
      await storageAdapter.saveSettings(next);
      set({ settings: next });
    },

    setSidebarOpen(open: boolean) {
      set({ sidebarOpen: open });
    },
  }));
}
