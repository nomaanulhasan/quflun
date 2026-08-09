import { Shield } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
}

/** Branded loading spinner with shield icon and spinning ring. */
export function LoadingSpinner({ label = 'Loading vault...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-1 items-center justify-center" aria-busy="true" aria-label={label}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <Shield className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
