'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVaultStore } from '@/components/providers';
import { Shell } from '@/components/layout/shell';
import { PageHeader } from '@/components/common/page-header';
import { BackupStatusCard } from '@/components/import-export/backup-status-card';
import { ImportSection } from '@/components/import-export/import-section';
import { ExportSection } from '@/components/import-export/export-section';
import { LockScreen } from '@/components/layout/lock-screen';

export default function ImportExportPage() {
  const status = useVaultStore((s) => s.status);
  const vaultId = useVaultStore((s) => s.vaultId);
  const vaultName = useVaultStore((s) => s.vaultName);
  const router = useRouter();

  useEffect(() => {
    if (status === 'locked' && !vaultId) router.replace('/');
  }, [status, vaultId, router]);

  if (status === 'locked' && vaultId) return <LockScreen />;
  if (status !== 'unlocked') return null;

  return (
    <Shell>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <PageHeader title="Import & Export" subtitle="Back up your vault or migrate data." />
        <BackupStatusCard />
        <ImportSection />
        <ExportSection vaultName={vaultName ?? 'quflun-vault'} />
      </div>
    </Shell>
  );
}
