'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SettingsCard } from '@/components/settings/settings-card';
import { FormError } from '@/components/ui/form-error';

export function ExportCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport(format: 'kdbx' | 'csv') {
    setError(null);
    setLoading(true);
    try {
      const { getServices } = await import('@/lib/runtime');
      const { engine } = await getServices();

      if (format === 'kdbx') {
        const { exportKdbx } = await import('@/lib/import-export/kdbx-handler');
        // Need the Kdbx db — export via engine's save mechanism
        // exportKdbx needs the db object. Access via getEntry approach won't work.
        // For now, use the storage adapter to get the encrypted blob directly.
        const vaultId = engine.getVaultId();
        if (!vaultId) { setError('No vault loaded.'); return; }
        const { storage } = await getServices();
        const buffer = await storage.loadVault(vaultId);
        if (!buffer) { setError('Vault data not found.'); return; }
        downloadFile(buffer, 'qufly-backup.kdbx', 'application/octet-stream');
      } else {
        const { exportCsv } = await import('@/lib/import-export/csv-handler');
        const entries = engine.listEntries();
        // Need full entry data with passwords for CSV export
        const fullEntries = entries.map((e) => {
          const full = engine.getEntry(e.uuid);
          return { title: full.title, username: full.username, password: full.password, url: full.url, notes: full.notes };
        });
        const csv = exportCsv(fullEntries);
        downloadFile(new TextEncoder().encode(csv).buffer as ArrayBuffer, 'qufly-export.csv', 'text/csv');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SettingsCard title="Export" description="Download your vault data locally. Never uploaded anywhere.">
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Exports are not encrypted beyond the selected format. Store backup files securely.
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleExport('kdbx')} disabled={loading} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> KDBX Backup
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleExport('csv')} disabled={loading} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> CSV Export
          </Button>
        </div>
        <FormError message={error} />
      </div>
    </SettingsCard>
  );
}

function downloadFile(buffer: ArrayBuffer, filename: string, mimeType: string) {
  const blob = new Blob([buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
