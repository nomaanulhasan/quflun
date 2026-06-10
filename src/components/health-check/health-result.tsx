import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { HealthCheckResult } from '@/lib/vault-engine';

interface HealthResultProps {
  result: HealthCheckResult;
}

export function HealthResult({ result }: HealthResultProps) {
  const icon = result.status === 'healthy'
    ? <CheckCircle className="h-5 w-5 text-green-600" />
    : result.status === 'corrupted'
      ? <XCircle className="h-5 w-5 text-destructive" />
      : <AlertTriangle className="h-5 w-5 text-amber-600" />;

  const label = result.status === 'healthy' ? 'Healthy' : result.status === 'corrupted' ? 'Issues Detected' : 'Error';

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        {icon}
        <h2 className="text-base font-semibold">{label}</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Stat label="Entries" value={result.entryCount} />
        <Stat label="Groups" value={result.groupCount} />
      </div>

      {result.errors.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-destructive">Errors:</p>
          <ul className="ml-4 list-disc text-xs text-muted-foreground space-y-0.5">
            {result.errors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}

      {result.status === 'corrupted' && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Export a backup immediately. Some data may be at risk.
        </p>
      )}

      <p className="text-xs text-muted-foreground">Checked: {new Date(result.timestamp).toLocaleString()}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted/50 p-2 text-center">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
