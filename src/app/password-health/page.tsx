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

  function handleOpenEntry(uuid: string) {
    router.push('/vault');
  }

  return (
    <Shell>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <PageHeader
          title="Vault Health"
          subtitle="Audit credentials and verify vault integrity."
        />

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Health sections">
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
        {tab === 'credentials' && (
          loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <ShieldAlert className="h-8 w-8 mx-auto text-muted-foreground animate-pulse" />
                <p className="text-sm text-muted-foreground">Analyzing vault...</p>
              </div>
            </div>
          ) : report ? (
            <div className="space-y-5">
              <HealthScore score={report.summary.score} />

              <div className="grid grid-cols-2 gap-3 text-center text-sm">
                <div className="rounded-lg bg-muted/50 p-2.5">
                  <p className="text-lg font-semibold">{report.summary.totalPasswords}</p>
                  <p className="text-xs text-muted-foreground">Passwords</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2.5">
                  <p className="text-lg font-semibold">{report.summary.totalNotes}</p>
                  <p className="text-xs text-muted-foreground">Notes</p>
                </div>
              </div>

              <HealthSummary summary={report.summary} onFilter={setFilter} />

              <HealthIssuesList
                issues={report.issues}
                filter={filter}
                onClearFilter={() => setFilter(null)}
                onOpenEntry={handleOpenEntry}
              />

              <p className="text-[10px] text-muted-foreground text-center">
                Analyzed {new Date(report.timestamp).toLocaleString()}
              </p>
            </div>
          ) : null
        )}

        {tab === 'integrity' && <VaultIntegrity />}
      </div>
    </Shell>
  );
}

// ─── Tab Button ────────────────────────────────────────────────────────────────

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
