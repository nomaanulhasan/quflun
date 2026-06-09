'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Plus, FolderOpen, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVaultStore } from '@/components/providers';
import { LockScreen } from '@/components/layout/lock-screen';
import { MASTER_PASSWORD_WEAK_THRESHOLD } from '@/lib/constants';

/**
 * Home page — vault selection, creation, or lock screen.
 *
 * States:
 * - No vault loaded: show create/open options
 * - Vault loaded but locked: show lock screen
 * - Vault unlocked: redirect to /vault
 */
export default function HomePage() {
  const status = useVaultStore((s) => s.status);
  const vaultId = useVaultStore((s) => s.vaultId);
  const router = useRouter();

  // Redirect to vault when unlocked (effect, not during render)
  useEffect(() => {
    if (status === 'unlocked') {
      router.replace('/vault');
    }
  }, [status, router]);

  // Render nothing while redirect is pending
  if (status === 'unlocked') {
    return null;
  }

  // If a vault is loaded but locked, show lock screen
  if (vaultId && status === 'locked') {
    return <LockScreen />;
  }

  // No vault loaded — show selection / creation
  return <VaultSelection />;
}

// ─── Vault Selection / Creation ────────────────────────────────────────────────

type View = 'selection' | 'create' | 'open';

function VaultSelection() {
  const [view, setView] = useState<View>('selection');

  if (view === 'create') {
    return <CreateVaultForm onBack={() => setView('selection')} />;
  }

  if (view === 'open') {
    return <OpenVaultForm onBack={() => setView('selection')} />;
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold">Qufly</h1>
          <p className="text-center text-sm text-muted-foreground">
            Privacy-first password manager. Your data stays on your device.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            className="w-full gap-2"
            onClick={() => setView('create')}
          >
            <Plus className="h-4 w-4" />
            Create New Vault
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setView('open')}
          >
            <FolderOpen className="h-4 w-4" />
            Open Vault File
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Vault Form ─────────────────────────────────────────────────────────

function CreateVaultForm({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const create = useVaultStore((s) => s.create);
  const router = useRouter();

  const isWeak = password.length > 0 && password.length < MASTER_PASSWORD_WEAK_THRESHOLD;
  const mismatch = confirm.length > 0 && password !== confirm;

  async function handleSubmit(e: React.FormEvent) {
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
          <p className="text-sm text-muted-foreground">
            Choose a strong master password. It cannot be recovered.
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
            <Input
              id="create-password"
              type="password"
              value={password}
              onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
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
            <Input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm((e.target as HTMLInputElement).value)}
              placeholder="Re-enter password"
              disabled={loading}
            />
            {mismatch && (
              <p className="text-xs text-destructive">Passwords do not match.</p>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onBack}
              disabled={loading}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || !password || !confirm}
            >
              {loading ? 'Creating...' : 'Create Vault'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Open Vault File Form ──────────────────────────────────────────────────────

function OpenVaultForm({ onBack }: { onBack: () => void }) {
  const [file, setFile] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const open = useVaultStore((s) => s.open);
  const router = useRouter();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target as HTMLInputElement;
    const selected = input.files?.[0];
    if (!selected) return;

    setFileName(selected.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setFile(reader.result as ArrayBuffer);
    };
    reader.onerror = () => {
      setError('Failed to read file.');
    };
    reader.readAsArrayBuffer(selected);
  }

  async function handleSubmit(e: React.FormEvent) {
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
          <p className="text-sm text-muted-foreground">
            Select a KDBX file and enter its master password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="vault-file" className="text-sm font-medium">
              Vault File
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                Choose File
              </Button>
              <span className="flex items-center text-sm text-muted-foreground truncate">
                {fileName || 'No file selected'}
              </span>
            </div>
            <input
              ref={fileInputRef}
              id="vault-file"
              type="file"
              accept=".kdbx"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="open-password" className="text-sm font-medium">
              Master Password
            </label>
            <Input
              id="open-password"
              type="password"
              value={password}
              onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
              placeholder="Enter master password"
              disabled={loading}
            />
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onBack}
              disabled={loading}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || !file || !password}
            >
              {loading ? 'Opening...' : 'Open Vault'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
