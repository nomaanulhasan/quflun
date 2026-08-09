'use client';

import { useEffect, useState } from 'react';
import { useUIStore } from '@/components/providers';
import { ExportCard } from '@/components/import-export/export-card';
import type { VaultEngine } from '@/lib/vault-engine';

interface ExportSectionProps {
  vaultName: string;
}

export function ExportSection({ vaultName }: ExportSectionProps) {
  const [engine, setEngine] = useState<VaultEngine | null>(null);
  const updateSettings = useUIStore((s) => s.updateSettings);

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
      onBackupComplete={() => updateSettings({ lastBackupDate: new Date().toISOString() })}
    />
  );
}
