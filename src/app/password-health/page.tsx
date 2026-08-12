'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, HeartPulse } from 'lucide-react';
import { useVaultStore } from '@/components/providers';
import { Shell } from '@/components/layout/shell';
import { PageHeader } from '@/components/common/page-header';
import { LockScreen } from '@/components/layout/lock-screen';
import { HealthScore } from '@/components/password-health/health-score';
import { HealthSummary } from '@/components/password-health/health-summary';
import { HealthIssuesList } from '@/components/password-health/health-issues-list';
import { VaultIntegrity } from '@/components/password-health/vault-integrity';
import { StatCard } from '@/components/ui/stat-card';
import { TabButton } from '@/components/ui/tab-button';
import { Muted, Small } from '@/components/ui/typography';
import type { PasswordHealthReport } from '@/lib/vault-engine';

type Tab = 'credentials' | 'integrity';

export default function PasswordHealthPage() {
  const status = useVaultStore((s) => s.status);
  const vaultId = useVaultStore((s) => s.vaultId);
  const router = useRouter();
  const [report, setReport] = useState<PasswordHealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('credentials');

  useEffect(() => {
    if (status === 'locked' && !vaultId) router.replace('/');
  }, [status, vaultId, router]);

  useEffect(() => {
    if (status !== 'unlocked') return;
    (async () => {
      try {
        const { getServices } = await import('@/lib/runtime');
        const { engine } = await getServices();
        setReport(engine.getPasswordHealthReport());
      } finally {
        setLoading(false);
      }
    })();
  }, [status]);

  if (status === 'locked' && vaultId) return <LockScreen />;
  if (status !== 'unlocked') return null;

  function handleOpenEntry(_uuid: string) {
    router.push('/vault');
  }

  return (
    <Shell>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <PageHeader title="Vault Health" subtitle="Audit credentials and verify vault integrity." />

        {/* Tabs */}
        <div
          className="bg-muted flex gap-1 rounded-lg p-1"
          role="tablist"
          aria-label="Health sections"
        >
          <TabButton
            active={tab === 'credentials'}
            onClick={() => setTab('credentials')}
            icon={<ShieldAlert className="h-4 w-4" aria-hidden="true" />}
            label="Credential Health"
          />
          <TabButton
            active={tab === 'integrity'}
            onClick={() => setTab('integrity')}
            icon={<HeartPulse className="h-4 w-4" aria-hidden="true" />}
            label="Vault Integrity"
          />
        </div>

        {/* Tab content */}
        {tab === 'credentials' &&
          (loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="space-y-2 text-center">
                <ShieldAlert className="text-muted-foreground mx-auto h-8 w-8 animate-pulse" />
                <Muted>Analyzing vault...</Muted>
              </div>
            </div>
          ) : report ? (
            <div className="space-y-5">
              <HealthScore score={report.summary.score} />

              <div className="grid grid-cols-3 gap-3 text-sm">
                <StatCard value={report.summary.totalPasswords} label="Passwords" />
                <StatCard value={report.summary.totalPins} label="PINs" />
                <StatCard value={report.summary.totalNotes} label="Notes" />
              </div>

              <HealthSummary summary={report.summary} onFilter={setFilter} />

              <HealthIssuesList
                issues={report.issues}
                filter={filter}
                onClearFilter={() => setFilter(null)}
                onOpenEntry={handleOpenEntry}
              />

              <Small className="text-center text-[10px]">
                Analyzed {new Date(report.timestamp).toLocaleString()}
              </Small>
            </div>
          ) : null)}

        {tab === 'integrity' && <VaultIntegrity />}
      </div>
    </Shell>
  );
}
