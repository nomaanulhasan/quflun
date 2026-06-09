'use client';

import { useUIStore } from '@/components/providers';
import { SettingsCard } from './settings-card';

export function SecuritySettings() {
  const settings = useUIStore((s) => s.settings);
  const updateSettings = useUIStore((s) => s.updateSettings);

  return (
    <SettingsCard title="Security" description="Configure automatic locking and clipboard behavior.">
      <div className="space-y-4">
        {/* Idle timeout */}
        <div className="space-y-1">
          <label htmlFor="idle-timeout" className="text-sm font-medium">
            Idle timeout: {settings.idleTimeoutMinutes} min
          </label>
          <input
            id="idle-timeout"
            type="range"
            min={1}
            max={60}
            value={settings.idleTimeoutMinutes}
            onChange={(e) => updateSettings({ idleTimeoutMinutes: Number(e.target.value) })}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Automatically lock the vault after inactivity.
          </p>
        </div>

        {/* Clipboard timeout */}
        <div className="space-y-1">
          <label htmlFor="clipboard-timeout" className="text-sm font-medium">
            Clipboard timeout: {settings.clipboardTimeoutSeconds}s
          </label>
          <input
            id="clipboard-timeout"
            type="range"
            min={5}
            max={120}
            value={settings.clipboardTimeoutSeconds}
            onChange={(e) => updateSettings({ clipboardTimeoutSeconds: Number(e.target.value) })}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Clear copied passwords from the clipboard.
          </p>
        </div>
      </div>
    </SettingsCard>
  );
}
