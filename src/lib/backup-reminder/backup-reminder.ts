import type { AppSettings } from '@/types';

/**
 * Determines whether a backup reminder should be shown.
 *
 * Returns true if:
 * - `lastBackupDate` is null (user has never backed up — first-time reminder)
 * - More than `backupReminderDays` have elapsed since `lastBackupDate` (periodic reminder)
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
 * Returns an appropriate backup reminder message based on whether the user
 * has ever backed up (first-time) or the periodic interval has exceeded.
 */
export function getBackupReminderMessage(settings: AppSettings): string {
  if (!settings.lastBackupDate) {
    return 'You haven\u2019t backed up your vault yet. Export a backup to protect against data loss.';
  }

  const diffMs = Date.now() - new Date(settings.lastBackupDate).getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (days === 0) {
    return 'Consider exporting a backup of your vault.';
  }
  if (days === 1) {
    return 'Your last backup was 1 day ago. Consider exporting a fresh backup.';
  }
  if (days < 30) {
    return `Your last backup was ${days} days ago. Consider exporting a fresh backup.`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `Your last backup was ${months} month${months > 1 ? 's' : ''} ago. Export a backup to stay protected.`;
  }
  const years = Math.floor(days / 365);
  return `Your last backup was over ${years} year${years > 1 ? 's' : ''} ago. Export a backup immediately to prevent data loss.`;
}

/**
 * Returns human-readable time since last backup for display purposes.
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
