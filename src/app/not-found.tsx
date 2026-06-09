import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

/**
 * Custom 404 page — does NOT show VaultSelection.
 * Provides a clear path back to the vault.
 */
export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <FileQuestion className="h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
      <h1 className="mt-4 text-xl font-semibold">Page Not Found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/vault"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          Return to Vault
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
