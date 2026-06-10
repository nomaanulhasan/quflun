'use client';

import { AlertTriangle } from 'lucide-react';
import { useUIStore } from '@/components/providers';
import { SettingsCard } from '@/components/settings/settings-card';

export function BackupStatusCard() {
  const settings = useUIStore((s) => s.settings);
  const lastBackup = settings.lastBackupDate;

  return (
    <SettingsCard title="Backup Status">
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Last backup</span>
          <span className="font-medium">
            {lastBackup ? new Date(lastBackup).toLocaleDateString() : 'Never'}
          </span>
        </div>

        <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium">Regular backups are strongly recommended.</p>
            <p>If you forget your master password, your data cannot be recovered. Qufly does not provide cloud backups.</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Private by design • Offline-first • Local-only
        </p>
      </div>
    </SettingsCard>
  );
}
