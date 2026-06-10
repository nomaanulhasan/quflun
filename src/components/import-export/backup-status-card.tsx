import { AlertTriangle } from 'lucide-react';
import { SettingsCard } from '@/components/settings/settings-card';

export function BackupStatusCard() {
  return (
    <SettingsCard title="Backup Status">
      <div className="space-y-2">
        <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-amber-800 dark:text-amber-400">Regular backups are strongly recommended.</p>
            <p className="text-xs text-amber-700 dark:text-amber-500">
              If you forget your master password, your data cannot be recovered. Qufly does not provide cloud backups.
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Private by design • Offline-first • Local-only
        </p>
      </div>
    </SettingsCard>
  );
}
