'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { FormError } from '@/components/ui/form-error';
import { useVaultStore } from '@/components/providers';

/**
 * Lock Screen — master password prompt with brute-force protection display.
 */
export function LockScreen() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const status = useVaultStore((s) => s.status);
  const error = useVaultStore((s) => s.error);
  const vaultName = useVaultStore((s) => s.vaultName);
  const unlock = useVaultStore((s) => s.unlock);
  const getBruteForceState = useVaultStore((s) => s.getBruteForceState);

  const bruteForce = getBruteForceState();
  const isCooldown = bruteForce.cooldownUntil > Date.now();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!password || loading || isCooldown) return;

    setLoading(true);
    try {
      await unlock(password);
    } catch {
      // Error captured in store
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-semibold">Vault Locked</h1>
          {vaultName && <p className="text-sm text-muted-foreground">{vaultName}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="unlock-password" className="text-sm font-medium">Master Password</label>
            <PasswordInput
              id="unlock-password"
              value={password}
              onChange={setPassword}
              placeholder="Enter master password"
              disabled={loading || isCooldown}
              autoFocus
              aria-describedby={error ? 'unlock-error' : undefined}
            />
          </div>

          <FormError message={error} id="unlock-error" />

          {isCooldown && (
            <p className="text-sm text-muted-foreground">
              Too many failed attempts. Please wait before trying again.
            </p>
          )}

          {bruteForce.failedAttempts > 0 && !isCooldown && (
            <p className="text-xs text-muted-foreground">
              {5 - bruteForce.failedAttempts} attempts remaining
            </p>
          )}

          <Button type="submit" className="w-full" disabled={!password || loading || isCooldown}>
            {loading || status === 'unlocking' ? 'Unlocking...' : 'Unlock'}
          </Button>
        </form>
      </div>
    </div>
  );
}
