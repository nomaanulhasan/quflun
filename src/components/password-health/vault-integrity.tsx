'use client';

import { useState } from 'react';
import { HeartPulse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HealthResult } from '@/components/health-check/health-result';
import type { HealthCheckResult } from '@/lib/vault-engine';

/**
 * Vault structural integrity check section.
 * Validates group hierarchy, UUID uniqueness, and KDBX serialization.
 */
export function VaultIntegrity() {
  const [result, setResult] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runCheck() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { getServices } = await import('@/lib/runtime');
      const { engine } = await getServices();
      const r = await engine.runHealthCheck();
      setResult(r);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold">Vault Integrity</h2>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Verify group hierarchy, entry integrity, and KDBX serialization.
        </p>
      </div>

      <Button onClick={runCheck} disabled={loading} variant="outline" size="sm" className="gap-1.5">
        <HeartPulse className="h-3.5 w-3.5" />
        {loading ? 'Checking...' : 'Run Integrity Check'}
      </Button>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {result && <HealthResult result={result} />}
    </div>
  );
}
