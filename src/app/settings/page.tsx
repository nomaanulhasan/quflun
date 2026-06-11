'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, HeartPulse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVaultStore, useUIStore } from '@/components/providers';
import { Shell } from '@/components/layout/shell';
import { PageHeader } from '@/components/common/page-header';
import { ThemeSettings } from '@/components/settings/theme-settings';
import { SecuritySettings } from '@/components/settings/security-settings';
import { BackupSettings } from '@/components/settings/backup-settings';
import { AboutSettings } from '@/components/settings/about-settings';

export default function SettingsPage() {
  const status = useVaultStore((s) => s.status);
  const lock = useVaultStore((s) => s.lock);
  const loadSettings = useUIStore((s) => s.loadSettings);
  const settingsLoaded = useUIStore((s) => s.settingsLoaded);
  const router = useRouter();

  useEffect(() => {
    if (!settingsLoaded) loadSettings();
  }, [settingsLoaded, loadSettings]);

  return (
    <Shell>
      <div className="mx-auto w-full max-w-lg space-y-6">
        <PageHeader title="Settings" subtitle="Customize Quflun behavior and preferences." />

        <ThemeSettings />
        <SecuritySettings />
        <BackupSettings />
        <AboutSettings />

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-2">
          {status === 'unlocked' && (
            <Button variant="outline" size="sm" onClick={lock} className="gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              Lock Vault
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => router.push('/health-check')} className="gap-1.5">
            <HeartPulse className="h-3.5 w-3.5" />
            Run Health Check
          </Button>
        </div>
      </div>
    </Shell>
  );
}
