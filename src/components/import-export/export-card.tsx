'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { SettingsCard } from '@/components/settings/settings-card';

interface ExportCardProps {
  onExportKdbx: () => Promise<ArrayBuffer>;
  onExportCsv: () => Promise<string>;
  vaultName: string;
  onBackupComplete?: () => void;
}

export function ExportCard({
  onExportKdbx,
  onExportCsv,
  vaultName,
  onBackupComplete,
}: ExportCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExportKdbx() {
    setError(null);
    setLoading(true);
    try {
      const buffer = await onExportKdbx();
      downloadFile(buffer, `${vaultName}.kdbx`, 'application/octet-stream');
      onBackupComplete?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleExportCsv() {
    setError(null);
    setLoading(true);
    try {
      const csv = await onExportCsv();
      downloadFile(new TextEncoder().encode(csv), `${vaultName}.csv`, 'text/csv');
      onBackupComplete?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SettingsCard title="Export" description="Download a backup of your vault.">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportKdbx}
            disabled={loading}
            className="gap-1.5"
          >
            <Download className="h-3.5 w-3.5" /> Export KDBX
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCsv}
            disabled={loading}
            className="gap-1.5"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          CSV exports are not encrypted. Store backup files securely.
        </p>
        <FormError message={error} />
      </div>
    </SettingsCard>
  );
}

function downloadFile(data: ArrayBuffer | Uint8Array, filename: string, mimeType: string) {
  const blob = new Blob([data as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
