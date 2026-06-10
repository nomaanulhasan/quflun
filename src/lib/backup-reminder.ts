import type { AppSettings } from '@/types';

/**
 * Determines whether a backup reminder should be shown.
 * Returns true if the configured interval has been exceeded since the last backup.
 */
export function shouldShowBackupReminder(settings: AppSettings): boolean {
  // If reminders are disabled (0 days), never show
  if (settings.backupReminderDays <= 0) return false;

  // If never backed up, always remind
  if (!settings.lastBackupDate) return true;

  const lastBackup = new Date(settings.lastBackupDate).getTime();
  const intervalMs = settings.backupReminderDays * 24 * 60 * 60 * 1000;
  const now = Date.now();

  return now - lastBackup > intervalMs;
}

/**
 * Returns human-readable time since last backup.
 */
export function timeSinceLastBackup(lastBackupDate: string | null): string {
  if (!lastBackupDate) return 'Never';

  const diffMs = Date.now() - new Date(lastBackupDate).getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}
