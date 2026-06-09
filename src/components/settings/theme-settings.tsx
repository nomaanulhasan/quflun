'use client';

import { useUIStore } from '@/components/providers';
import { SettingsCard } from './settings-card';
import type { AppSettings } from '@/types';

const THEME_OPTIONS: { value: AppSettings['theme']; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function ThemeSettings() {
  const settings = useUIStore((s) => s.settings);
  const updateSettings = useUIStore((s) => s.updateSettings);

  return (
    <SettingsCard title="Appearance" description="Choose your preferred theme.">
      <div className="flex gap-2">
        {THEME_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateSettings({ theme: opt.value })}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              settings.theme === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
            aria-pressed={settings.theme === opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </SettingsCard>
  );
}
