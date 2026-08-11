'use client';

import { AlertTriangle } from 'lucide-react';
import { SettingsCard } from '@/components/settings/settings-card';
import { useUIStore } from '@/components/providers';
import { timeSinceLastBackup } from '@/lib/backup-reminder';

export function BackupStatusCard() {
  const lastBackupDate = useUIStore((s) => s.settings.lastBackupDate);
  const lastBackup = timeSinceLastBackup(lastBackupDate);

  return (
    <SettingsCard title="Backup Status">
      <div className="space-y-2">
        <div className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm dark:bg-amber-950/30">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="space-y-1">
            <p className="font-medium text-amber-800 dark:text-amber-400">
              Regular backups are strongly recommended.
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-500">
              If you forget your master password, your data cannot be recovered. Quflun does not
              provide cloud backups.
            </p>
          </div>
        </div>
        <p className="text-muted-foreground text-xs">
          Last backup: {lastBackup} • Private by design • Offline-first • Local-only
        </p>
      </div>
    </SettingsCard>
  );
}
