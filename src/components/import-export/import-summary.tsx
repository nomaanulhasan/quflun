import type { ImportResult } from '@/lib/import-export';

interface ImportSummaryProps {
  result: ImportResult;
}

export function ImportSummary({ result }: ImportSummaryProps) {
  return (
    <div className="rounded-md border border-border bg-muted/50 p-3 text-sm space-y-1">
      <p><strong>{result.imported}</strong> entries imported</p>
      {result.skipped.length > 0 && (
        <>
          <p className="text-muted-foreground">{result.skipped.length} skipped:</p>
          <ul className="ml-4 list-disc text-xs text-muted-foreground space-y-0.5">
            {result.skipped.slice(0, 5).map((s, i) => (
              <li key={i}>{s.identifier}: {s.reason}</li>
            ))}
            {result.skipped.length > 5 && (
              <li>...and {result.skipped.length - 5} more</li>
            )}
          </ul>
        </>
      )}
    </div>
  );
}
