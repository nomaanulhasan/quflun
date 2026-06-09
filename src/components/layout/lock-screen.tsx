'use client';

import { useState } from 'react';
import { Lock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVaultStore } from '@/components/providers';

/**
 * Lock Screen — master password prompt for unlocking an existing vault.
 * Displays brute-force cooldown information when applicable.
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || loading || isCooldown) return;

    setLoading(true);
    try {
      await unlock(password);
    } catch {
      // Error is captured in store.error
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo / Title */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-semibold">Vault Locked</h1>
          {vaultName && (
            <p className="text-sm text-muted-foreground">{vaultName}</p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="unlock-password" className="text-sm font-medium">
              Master Password
            </label>
            <Input
              id="unlock-password"
              type="password"
              value={password}
              onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
              placeholder="Enter master password"
              disabled={loading || isCooldown}
              autoFocus
              aria-describedby={error ? 'unlock-error' : undefined}
            />
          </div>

          {/* Error display */}
          {error && (
            <div
              id="unlock-error"
              role="alert"
              className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Cooldown display */}
          {isCooldown && (
            <p className="text-sm text-muted-foreground">
              Too many failed attempts. Please wait before trying again.
            </p>
          )}

          {/* Failed attempts indicator */}
          {bruteForce.failedAttempts > 0 && !isCooldown && (
            <p className="text-xs text-muted-foreground">
              {5 - bruteForce.failedAttempts} attempts remaining
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={!password || loading || isCooldown}
          >
            {loading || status === 'unlocking' ? 'Unlocking...' : 'Unlock'}
          </Button>
        </form>
      </div>
    </div>
  );
}
