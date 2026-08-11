'use client';

import { useUIStore } from '@/components/providers';
import { Select } from '@/components/ui/select';
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
      <Select
        id="backup-reminder"
        label="Reminder interval"
        description="Export your vault regularly using KDBX format for safe backup."
        value={settings.backupReminderDays}
        onChange={(e) => updateSettings({ backupReminderDays: Number(e.target.value) })}
      >
        {REMINDER_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </SettingsCard>
  );
}
