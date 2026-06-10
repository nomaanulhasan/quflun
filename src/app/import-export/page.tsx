'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVaultStore } from '@/components/providers';
import { Shell } from '@/components/layout/shell';
import { PageHeader } from '@/components/common/page-header';
import { ImportCard } from '@/components/import-export/import-card';
import { ExportCard } from '@/components/import-export/export-card';
import { BackupStatusCard } from '@/components/import-export/backup-status-card';
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
      <div className="mx-auto w-full max-w-lg space-y-6">
        <PageHeader title="Import & Export" subtitle="Back up your vault or migrate data." />
        <BackupStatusCard />
        <ImportSection />
        <ExportSection vaultName={vaultName ?? 'qufly-vault'} />
      </div>
    </Shell>
  );
}

function ImportSection() {
  const [engine, setEngine] = useState<import('@/lib/vault-engine').VaultEngine | null>(null);

  useEffect(() => {
    (async () => {
      const { getServices } = await import('@/lib/runtime');
      const { engine: e } = await getServices();
      setEngine(e);
    })();
  }, []);

  if (!engine) return null;

  return (
    <ImportCard
      onImportKdbx={(file, pw) => engine.importKdbx(file, pw)}
      onImportCsv={(csv) => engine.importCsvEntries(csv)}
    />
  );
}

function ExportSection({ vaultName }: { vaultName: string }) {
  const [engine, setEngine] = useState<import('@/lib/vault-engine').VaultEngine | null>(null);

  useEffect(() => {
    (async () => {
      const { getServices } = await import('@/lib/runtime');
      const { engine: e } = await getServices();
      setEngine(e);
    })();
  }, []);

  if (!engine) return null;

  return (
    <ExportCard
      onExportKdbx={() => engine.exportKdbx()}
      onExportCsv={() => engine.exportCsvEntries()}
      vaultName={vaultName}
    />
  );
}
