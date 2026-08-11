'use client';

import { useUIStore } from '@/components/providers';
import { SettingsCard } from './settings-card';

const REMINDER_OPTIONS = [
  { value: 0, label: 'Never' },
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
];

export function BackupSettings() {
  const settings = useUIStore((s) => s.settings);
  const updateSettings = useUIStore((s) => s.updateSettings);

  return (
    <SettingsCard title="Backup" description="Regular backups are strongly recommended.">
      <div className="space-y-2">
        <label htmlFor="backup-reminder" className="text-sm font-medium">
          Reminder interval
        </label>
        <select
          id="backup-reminder"
          value={settings.backupReminderDays}
          onChange={(e) => updateSettings({ backupReminderDays: Number(e.target.value) })}
          className="border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
        >
          {REMINDER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="text-muted-foreground text-xs">
          Export your vault regularly using KDBX format for safe backup.
        </p>
      </div>
    </SettingsCard>
  );
}
