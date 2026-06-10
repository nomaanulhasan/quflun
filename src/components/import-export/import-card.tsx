'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SettingsCard } from '@/components/settings/settings-card';
import { FilePicker } from '@/components/forms/file-picker';
import { PasswordField } from '@/components/forms/password-field';
import { FormError } from '@/components/ui/form-error';
import { ImportSummary } from './import-summary';
import type { ImportResult } from '@/lib/import-export';

export function ImportCard() {
  const [mode, setMode] = useState<'kdbx' | 'csv'>('kdbx');
  const [file, setFile] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleImport() {
    if (!file) { setError('Select a file first.'); return; }
    if (mode === 'kdbx' && !password) { setError('Password is required for KDBX.'); return; }

    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const { getServices } = await import('@/lib/runtime');
      const { engine } = await getServices();

      if (mode === 'kdbx') {
        setError('KDBX import requires additional engine integration. Use CSV import for now, or export/re-create your vault.');
      } else {
        const { importCsv } = await import('@/lib/import-export/csv-handler');
        const text = new TextDecoder().decode(new Uint8Array(file));
        const { rows, result: csvResult } = importCsv(text);

        // Add each row as a new entry
        for (const row of rows) {
          await engine.addEntry({
            title: row.title,
            username: row.username,
            password: row.password,
            url: row.url,
            notes: row.notes || '',
          });
        }
        setResult(csvResult);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SettingsCard title="Import" description="Import entries from KDBX or CSV files.">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button size="sm" variant={mode === 'kdbx' ? 'default' : 'outline'} onClick={() => setMode('kdbx')}>KDBX</Button>
          <Button size="sm" variant={mode === 'csv' ? 'default' : 'outline'} onClick={() => setMode('csv')}>CSV</Button>
        </div>

        <FilePicker
          id="import-file"
          accept={mode === 'kdbx' ? '.kdbx' : '.csv'}
          fileName={fileName}
          disabled={loading}
          onFileSelected={(buf, name) => { setFile(buf); setFileName(name); setError(null); setResult(null); }}
          onError={setError}
        />

        {mode === 'kdbx' && (
          <PasswordField id="import-password" label="File Password" value={password} onChange={setPassword} placeholder="Password for the KDBX file" disabled={loading} />
        )}

        <Button onClick={handleImport} disabled={loading || !file} size="sm">
          {loading ? 'Importing...' : 'Import'}
        </Button>

        <FormError message={error} />
        {result && <ImportSummary result={result} />}
      </div>
    </SettingsCard>
  );
}
