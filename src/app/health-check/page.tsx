'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HeartPulse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVaultStore } from '@/components/providers';
import { Shell } from '@/components/layout/shell';
import { PageHeader } from '@/components/common/page-header';
import { LockScreen } from '@/components/layout/lock-screen';
import { HealthResult } from '@/components/health-check/health-result';
import type { HealthCheckResult } from '@/lib/vault-engine';

export default function HealthCheckPage() {
  const status = useVaultStore((s) => s.status);
  const vaultId = useVaultStore((s) => s.vaultId);
  const router = useRouter();
  const [result, setResult] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'locked' && !vaultId) router.replace('/');
  }, [status, vaultId, router]);

  if (status === 'locked' && vaultId) return <LockScreen />;
  if (status !== 'unlocked') return null;

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
    <Shell>
      <div className="mx-auto w-full max-w-lg space-y-6">
        <PageHeader title="Health Check" subtitle="Validate the structural integrity of your vault." />

        <Button onClick={runCheck} disabled={loading} className="gap-1.5">
          <HeartPulse className="h-4 w-4" />
          {loading ? 'Checking...' : 'Run Health Check'}
        </Button>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {result && <HealthResult result={result} />}

        {!result && !loading && (
          <p className="text-sm text-muted-foreground">
            Verifies group hierarchy, entry integrity, UUID uniqueness, and KDBX serialization without exposing secrets.
          </p>
        )}
      </div>
    </Shell>
  );
}
