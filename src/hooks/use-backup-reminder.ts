'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useVaultStore, useUIStore } from '@/components/providers';
import { shouldShowBackupReminder, getBackupReminderMessage } from '@/lib/backup-reminder';

/**
 * Shows a non-blocking backup reminder toast when the vault becomes unlocked
 * and the configured backup interval has been exceeded (or on first-time vault creation).
 *
 * Behavior:
 * - On vault creation (first-time): shows a recommendation to export a backup
 * - On periodic interval exceeded: shows a reminder with elapsed time info
 * - Only fires once per session to avoid nagging
 *
 * Validates: Requirements 22.1, 22.4
 */
export function useBackupReminder() {
  const status = useVaultStore((s) => s.status);
  const settings = useUIStore((s) => s.settings);
  const settingsLoaded = useUIStore((s) => s.settingsLoaded);
  const loadSettings = useUIStore((s) => s.loadSettings);
  const shownRef = useRef(false);

  // Ensure settings are loaded
  useEffect(() => {
    if (!settingsLoaded) {
      loadSettings();
    }
  }, [settingsLoaded, loadSettings]);

  useEffect(() => {
    if (status !== 'unlocked') return;
    if (!settingsLoaded) return;
    if (shownRef.current) return;

    if (shouldShowBackupReminder(settings)) {
      const message = getBackupReminderMessage(settings);
      const isFirstTime = !settings.lastBackupDate;
      shownRef.current = true;

      toast.warning(isFirstTime ? 'Create a backup' : 'Backup reminder', {
        description: message,
        duration: 8000,
        action: {
          label: 'Dismiss',
          onClick: () => {},
        },
      });
    }
  }, [status, settingsLoaded, settings]);
}
