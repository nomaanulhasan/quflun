import type { ImportResult } from '@/lib/import-export';

interface ImportSummaryProps {
  result: ImportResult;
}

export function ImportSummary({ result }: ImportSummaryProps) {
  return (
    <div className="border-border bg-muted/50 space-y-1 rounded-md border p-3 text-sm">
      <p>
        <strong>{result.imported}</strong> entries imported
      </p>
      {result.skipped.length > 0 && (
        <>
          <p className="text-muted-foreground">{result.skipped.length} skipped:</p>
          <ul className="text-muted-foreground ml-4 list-disc space-y-0.5 text-xs">
            {result.skipped.slice(0, 5).map((s, i) => (
              <li key={i}>
                {s.identifier}: {s.reason}
              </li>
            ))}
            {result.skipped.length > 5 && <li>...and {result.skipped.length - 5} more</li>}
          </ul>
        </>
      )}
    </div>
  );
}
