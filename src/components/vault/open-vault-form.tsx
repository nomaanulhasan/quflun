'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PasswordInput } from '@/components/ui/password-input';
import { FormError } from '@/components/ui/form-error';
import { FilePicker } from '@/components/forms/file-picker';
import { FormActions } from '@/components/forms/form-actions';
import { useVaultStore } from '@/components/providers';

interface OpenVaultFormProps {
  onBack: () => void;
}

export function OpenVaultForm({ onBack }: OpenVaultFormProps) {
  const [file, setFile] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const open = useVaultStore((s) => s.open);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError('Please select a KDBX file.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);
    try {
      await open(file, password);
      router.replace('/vault');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Open Vault File</h1>
          <p className="text-muted-foreground text-sm">
            Select a KDBX file and enter its master password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="vault-file" className="text-sm font-medium">
              Vault File
            </label>
            <FilePicker
              id="vault-file"
              accept=".kdbx"
              fileName={fileName}
              disabled={loading}
              onFileSelected={(buf, name) => {
                setFile(buf);
                setFileName(name);
                setError(null);
              }}
              onError={setError}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="open-password" className="text-sm font-medium">
              Master Password
            </label>
            <PasswordInput
              id="open-password"
              value={password}
              onChange={setPassword}
              placeholder="Enter master password"
              disabled={loading}
            />
          </div>

          <FormError message={error} />

          <FormActions
            submitLabel="Open Vault"
            loadingLabel="Opening..."
            loading={loading}
            disabled={!file || !password}
            onBack={onBack}
          />
        </form>
      </div>
    </div>
  );
}
