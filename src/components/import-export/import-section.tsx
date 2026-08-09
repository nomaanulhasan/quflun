'use client';

import { useEffect, useState } from 'react';
import { ImportCard } from '@/components/import-export/import-card';
import type { VaultEngine } from '@/lib/vault-engine';

export function ImportSection() {
  const [engine, setEngine] = useState<VaultEngine | null>(null);

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
