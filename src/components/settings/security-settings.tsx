'use client';

import { useUIStore } from '@/components/providers';
import { Slider } from '@/components/ui/slider';
import { SettingsCard } from './settings-card';

export function SecuritySettings() {
  const settings = useUIStore((s) => s.settings);
  const updateSettings = useUIStore((s) => s.updateSettings);

  return (
    <SettingsCard
      title="Security"
      description="Configure automatic locking and clipboard behavior."
    >
      <div className="space-y-4">
        <Slider
          id="idle-timeout"
          label={`Idle timeout: ${settings.idleTimeoutMinutes} min`}
          description="Automatically lock the vault after inactivity."
          min={1}
          max={60}
          value={settings.idleTimeoutMinutes}
          onValueChange={(v) => updateSettings({ idleTimeoutMinutes: v })}
        />
        <Slider
          id="clipboard-timeout"
          label={`Clipboard timeout: ${settings.clipboardTimeoutSeconds}s`}
          description="Clear copied passwords from the clipboard."
          min={5}
          max={120}
          value={settings.clipboardTimeoutSeconds}
          onValueChange={(v) => updateSettings({ clipboardTimeoutSeconds: v })}
        />
      </div>
    </SettingsCard>
  );
}
