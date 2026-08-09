'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Plus, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVaultStore } from '@/components/providers';
import { LockScreen } from '@/components/layout/lock-screen';
import { CreateVaultForm } from '@/components/vault/create-vault-form';
import { OpenVaultForm } from '@/components/vault/open-vault-form';
import { VersionBadge } from '@/components/common/version-badge';

export default function HomePage() {
  const status = useVaultStore((s) => s.status);
  const vaultId = useVaultStore((s) => s.vaultId);
  const router = useRouter();

  useEffect(() => {
    if (status === 'unlocked') router.replace('/vault');
  }, [status, router]);

  if (status === 'unlocked' || status === 'unlocking') return null;
  if (vaultId && status === 'locked') return <LockScreen />;

  return <VaultSelection />;
}

// ─── Vault Selection ───────────────────────────────────────────────────────────

type View = 'selection' | 'create' | 'open';

function VaultSelection() {
  const [view, setView] = useState<View>('selection');

  if (view === 'create') return <CreateVaultForm onBack={() => setView('selection')} />;
  if (view === 'open') return <OpenVaultForm onBack={() => setView('selection')} />;

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold">Quflun</h1>
          <p className="text-center text-sm text-muted-foreground">
            Privacy-first password manager. Your data stays on your device.
          </p>
        </div>

        <div className="space-y-3">
          <Button className="w-full gap-2" onClick={() => setView('create')}>
            <Plus className="h-4 w-4" />
            Create New Vault
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={() => setView('open')}>
            <FolderOpen className="h-4 w-4" />
            Open Vault File
          </Button>
        </div>

        <VersionBadge />
      </div>
    </div>
  );
}
