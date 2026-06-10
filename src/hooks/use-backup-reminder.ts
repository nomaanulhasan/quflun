'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useVaultStore, useUIStore } from '@/components/providers';
import { shouldShowBackupReminder, timeSinceLastBackup } from '@/lib/backup-reminder';

/**
 * Shows a non-blocking backup reminder toast when the vault becomes unlocked
 * and the configured backup interval has been exceeded.
 *
 * Only fires once per session to avoid nagging.
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
      const lastBackup = timeSinceLastBackup(settings.lastBackupDate);
      shownRef.current = true;

      toast.warning('Backup reminder', {
        description: `Last backup: ${lastBackup}. Consider exporting a backup of your vault.`,
        duration: 8000,
        action: {
          label: 'Dismiss',
          onClick: () => {},
        },
      });
    }
  }, [status, settingsLoaded, settings]);
}
