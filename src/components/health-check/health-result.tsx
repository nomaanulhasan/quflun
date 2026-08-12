import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { H3, Text, Small } from '@/components/ui/typography';
import { StatCard } from '@/components/ui/stat-card';
import type { HealthCheckResult } from '@/lib/vault-engine';

interface HealthResultProps {
  result: HealthCheckResult;
}

export function HealthResult({ result }: HealthResultProps) {
  const icon =
    result.status === 'healthy' ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : result.status === 'corrupted' ? (
      <XCircle className="text-destructive h-5 w-5" />
    ) : (
      <AlertTriangle className="h-5 w-5 text-amber-600" />
    );

  const label =
    result.status === 'healthy'
      ? 'Healthy'
      : result.status === 'corrupted'
        ? 'Issues Detected'
        : 'Error';

  return (
    <div className="border-border bg-card space-y-4 rounded-lg border p-5">
      <div className="flex items-center gap-3">
        {icon}
        <H3>{label}</H3>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <StatCard label="Entries" value={result.entryCount} />
        <StatCard label="Categories" value={result.groupCount} />
      </div>

      {result.errors.length > 0 && (
        <div className="space-y-1">
          <Text className="text-destructive font-medium">Errors:</Text>
          <ul className="text-muted-foreground ml-4 list-disc space-y-0.5 text-xs">
            {result.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {result.status === 'corrupted' && (
        <Small className="text-amber-700 dark:text-amber-400">
          Export a backup immediately. Some data may be at risk.
        </Small>
      )}

      <Small>Checked: {new Date(result.timestamp).toLocaleString()}</Small>
    </div>
  );
}
