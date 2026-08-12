'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { H1, Muted, Small } from '@/components/ui/typography';
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
          <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
            <Lock className="text-primary h-6 w-6" />
          </div>
          <H1>Vault Locked</H1>
          {vaultName && <Muted>{vaultName}</Muted>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            id="unlock-password"
            type="password"
            label="Master Password"
            value={password}
            onChange={setPassword}
            placeholder="Enter master password"
            disabled={loading || isCooldown}
            autoFocus
          />

          <FormError message={error} id="unlock-error" />

          {isCooldown && <Muted>Too many failed attempts. Please wait before trying again.</Muted>}

          {bruteForce.failedAttempts > 0 && !isCooldown && (
            <Small>{5 - bruteForce.failedAttempts} attempts remaining</Small>
          )}

          <Button type="submit" className="w-full" disabled={!password || loading || isCooldown}>
            {loading || status === 'unlocking' ? 'Unlocking...' : 'Unlock'}
          </Button>
        </form>
      </div>
    </div>
  );
}
