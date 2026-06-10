'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { FilePicker } from '@/components/forms/file-picker';
import { FormError } from '@/components/ui/form-error';
import { SettingsCard } from '@/components/settings/settings-card';
import { ImportSummary } from './import-summary';
import type { ImportResult } from '@/lib/import-export';

interface ImportCardProps {
  onImportKdbx: (file: ArrayBuffer, password: string) => Promise<ImportResult>;
  onImportCsv: (content: string) => Promise<ImportResult>;
}

export function ImportCard({ onImportKdbx, onImportCsv }: ImportCardProps) {
  const [file, setFile] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const isKdbx = fileName.endsWith('.kdbx');
  const isCsv = fileName.endsWith('.csv');

  async function handleImport() {
    if (!file) return;
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      if (isKdbx) {
        if (!password) { setError('Password required for KDBX files.'); setLoading(false); return; }
        const r = await onImportKdbx(file, password);
        setResult(r);
      } else if (isCsv) {
        const text = new TextDecoder().decode(new Uint8Array(file));
        const r = await onImportCsv(text);
        setResult(r);
      } else {
        setError('Unsupported file type. Use .kdbx or .csv');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SettingsCard title="Import" description="Import entries from a KDBX or CSV file.">
      <div className="space-y-3">
        <FilePicker
          id="import-file"
          accept=".kdbx,.csv"
          fileName={fileName}
          disabled={loading}
          onFileSelected={(buf, name) => { setFile(buf); setFileName(name); setError(null); setResult(null); }}
          onError={setError}
        />
        {isKdbx && (
          <PasswordInput
            id="import-password"
            value={password}
            onChange={setPassword}
            placeholder="Import file password"
            disabled={loading}
          />
        )}
        <Button size="sm" onClick={handleImport} disabled={loading || !file} className="gap-1.5">
          <Upload className="h-3.5 w-3.5" />
          {loading ? 'Importing...' : 'Import'}
        </Button>
        <FormError message={error} />
        {result && <ImportSummary result={result} />}
      </div>
    </SettingsCard>
  );
}
