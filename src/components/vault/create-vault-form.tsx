'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { FormError } from '@/components/ui/form-error';
import { FormActions } from '@/components/forms/form-actions';
import { useVaultStore } from '@/components/providers';
import { MASTER_PASSWORD_WEAK_THRESHOLD } from '@/lib/constants';
import { toast } from 'sonner';

interface CreateVaultFormProps {
  onBack: () => void;
}

export function CreateVaultForm({ onBack }: CreateVaultFormProps) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const create = useVaultStore((s) => s.create);
  const router = useRouter();

  const isWeak = password.length > 0 && password.length < MASTER_PASSWORD_WEAK_THRESHOLD;
  const mismatch = confirm.length > 0 && password !== confirm;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Vault name is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await create(password, name.trim());
      toast.success('Vault created!', {
        description: 'Consider exporting a backup to keep your data safe.',
        duration: 6000,
      });
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
          <h1 className="text-xl font-semibold">Create New Vault</h1>
          <p className="text-muted-foreground text-sm">Choose a strong master password.</p>
          <p className="text-xs font-medium text-amber-600 dark:text-amber-500">
            ⚠ Password is never recoverable. If you forget it, your data is lost.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="vault-name" className="text-sm font-medium">
              Vault Name
            </label>
            <Input
              id="vault-name"
              value={name}
              onChange={(e) => setName((e.target as HTMLInputElement).value)}
              placeholder="My Vault"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="create-password" className="text-sm font-medium">
              Master Password
            </label>
            <PasswordInput
              id="create-password"
              value={password}
              onChange={setPassword}
              placeholder="Enter master password"
              disabled={loading}
            />
            {isWeak && (
              <p className="flex items-center gap-1 text-xs text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                Weak password (less than 8 characters)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-password" className="text-sm font-medium">
              Confirm Password
            </label>
            <PasswordInput
              id="confirm-password"
              value={confirm}
              onChange={setConfirm}
              placeholder="Re-enter password"
              disabled={loading}
            />
            {mismatch && <p className="text-destructive text-xs">Passwords do not match.</p>}
          </div>

          <FormError message={error} />

          <FormActions
            submitLabel="Create Vault"
            loadingLabel="Creating..."
            loading={loading}
            disabled={!password || !confirm}
            onBack={onBack}
          />
        </form>
      </div>
    </div>
  );
}
