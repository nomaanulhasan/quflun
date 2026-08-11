import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AppSettings } from '@/types';
import {
  shouldShowBackupReminder,
  getBackupReminderMessage,
  timeSinceLastBackup,
  getDestructiveWarningMessage,
} from '@/lib/backup-reminder';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function makeSettings(overrides: Partial<AppSettings> = {}): AppSettings {
  return {
    idleTimeoutMinutes: 5,
    clipboardTimeoutSeconds: 30,
    backupReminderDays: 30,
    lastBackupDate: null,
    theme: 'system',
    ...overrides,
  };
}

function daysAgo(days: number): string {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

// ─── shouldShowBackupReminder ──────────────────────────────────────────────────

describe('shouldShowBackupReminder', () => {
  it('returns true when lastBackupDate is null (never backed up)', () => {
    const settings = makeSettings({ lastBackupDate: null });
    expect(shouldShowBackupReminder(settings)).toBe(true);
  });

  it('returns true when interval has been exceeded', () => {
    const settings = makeSettings({
      backupReminderDays: 30,
      lastBackupDate: daysAgo(31),
    });
    expect(shouldShowBackupReminder(settings)).toBe(true);
  });

  it('returns false when interval has not been exceeded', () => {
    const settings = makeSettings({
      backupReminderDays: 30,
      lastBackupDate: daysAgo(10),
    });
    expect(shouldShowBackupReminder(settings)).toBe(false);
  });

  it('returns false when backupReminderDays is 0 (disabled)', () => {
    const settings = makeSettings({
      backupReminderDays: 0,
      lastBackupDate: null,
    });
    expect(shouldShowBackupReminder(settings)).toBe(false);
  });

  it('returns false when backup was exactly at the boundary', () => {
    // Just under 30 days ago should NOT trigger (needs to exceed, not equal)
    const almostThirtyDays = 30 * 24 * 60 * 60 * 1000 - 1000; // 1 second less than 30 days
    const settings = makeSettings({
      backupReminderDays: 30,
      lastBackupDate: new Date(Date.now() - almostThirtyDays).toISOString(),
    });
    // At boundary, should not show (needs to exceed)
    expect(shouldShowBackupReminder(settings)).toBe(false);
  });
});

// ─── getBackupReminderMessage ──────────────────────────────────────────────────

describe('getBackupReminderMessage', () => {
  it('returns first-time message when lastBackupDate is null', () => {
    const settings = makeSettings({ lastBackupDate: null });
    const msg = getBackupReminderMessage(settings);
    expect(msg).toContain('haven\u2019t backed up');
    expect(msg).toContain('Export a backup');
  });

  it('returns periodic message with days when interval exceeded', () => {
    const settings = makeSettings({ lastBackupDate: daysAgo(15) });
    const msg = getBackupReminderMessage(settings);
    expect(msg).toContain('15 days ago');
  });

  it('returns message with months for older backups', () => {
    const settings = makeSettings({ lastBackupDate: daysAgo(90) });
    const msg = getBackupReminderMessage(settings);
    expect(msg).toContain('3 month');
  });

  it('returns message with years for very old backups', () => {
    const settings = makeSettings({ lastBackupDate: daysAgo(400) });
    const msg = getBackupReminderMessage(settings);
    expect(msg).toContain('1 year');
  });
});

// ─── timeSinceLastBackup ───────────────────────────────────────────────────────

describe('timeSinceLastBackup', () => {
  it('returns "Never" when null', () => {
    expect(timeSinceLastBackup(null)).toBe('Never');
  });

  it('returns "Today" for recent backup', () => {
    expect(timeSinceLastBackup(new Date().toISOString())).toBe('Today');
  });

  it('returns "1 day ago" for yesterday', () => {
    expect(timeSinceLastBackup(daysAgo(1))).toBe('1 day ago');
  });

  it('returns days for recent past', () => {
    expect(timeSinceLastBackup(daysAgo(7))).toBe('7 days ago');
  });

  it('returns months for 30+ days', () => {
    expect(timeSinceLastBackup(daysAgo(60))).toBe('2 months ago');
  });
});

// ─── getDestructiveWarningMessage ──────────────────────────────────────────────

describe('getDestructiveWarningMessage', () => {
  it('returns vault deletion warning with backup recommendation', () => {
    const msg = getDestructiveWarningMessage('vault-delete');
    expect(msg).toContain('permanently');
    expect(msg).toContain('backup');
  });

  it('returns entry deletion warning with backup recommendation', () => {
    const msg = getDestructiveWarningMessage('entry-delete');
    expect(msg).toContain('permanently deleted');
    expect(msg).toContain('backup');
  });

  it('returns import overwrite warning with backup recommendation', () => {
    const msg = getDestructiveWarningMessage('import-overwrite');
    expect(msg).toContain('overwrite');
    expect(msg).toContain('backup');
  });
});
