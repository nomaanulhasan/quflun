import type { ImportResult } from '@/lib/import-export';

interface ImportSummaryProps {
  result: ImportResult;
}

export function ImportSummary({ result }: ImportSummaryProps) {
  return (
    <div className="rounded-md border border-border bg-muted/50 p-4 space-y-2 text-sm">
      <div className="flex justify-between">
        <span>Imported</span>
        <span className="font-medium">{result.imported}</span>
      </div>
      <div className="flex justify-between">
        <span>Skipped</span>
        <span className="font-medium">{result.skipped.length}</span>
      </div>
      <div className="flex justify-between">
        <span>Total processed</span>
        <span className="font-medium">{result.total}</span>
      </div>
      {result.skipped.length > 0 && (
        <details className="pt-2">
          <summary className="cursor-pointer text-xs text-muted-foreground">Show skip reasons</summary>
          <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
            {result.skipped.map((s, i) => (
              <li key={i}>{s.identifier}: {s.reason}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
