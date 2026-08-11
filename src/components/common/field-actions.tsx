'use client';

import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CopyButton } from './copy-button';

interface CopyActionProps {
  copied: boolean;
  label: string;
  onCopy: (e: React.MouseEvent) => void;
  disabled?: boolean;
}

interface OpenLinkActionProps {
  url: string;
  disabled?: boolean;
}

/**
 * Copy action for a form field (username, password).
 */
export function CopyAction({ copied, label, onCopy, disabled }: CopyActionProps) {
  return <CopyButton copied={copied} label={label} onClick={onCopy} disabled={disabled} />;
}

/**
 * Open link action for URL fields.
 * Uses target="_blank" + rel="noopener noreferrer".
 * Disabled when URL is empty or invalid.
 */
export function OpenLinkAction({ url, disabled }: OpenLinkActionProps) {
  const isValid = url.length > 0 && isValidUrl(url);
  const canOpen = isValid && !disabled;

  if (canOpen) {
    return (
      <a
        href={normalizeUrl(url)}
        target="_blank"
        rel="noopener noreferrer"
        title="Open website"
        aria-label="Open website"
        className="hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 inline-flex size-7 shrink-0 items-center justify-center rounded-[min(var(--radius-md),12px)] text-sm font-medium transition-all outline-none select-none focus-visible:ring-3 [&_svg]:pointer-events-none [&_svg]:shrink-0"
      >
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      title="Open website"
      aria-label="Open website"
      disabled
    >
      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
    </Button>
  );
}

/**
 * Check if a URL string is plausibly valid.
 * Accepts urls with or without protocol.
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(normalizeUrl(url));
    return true;
  } catch {
    return false;
  }
}

/**
 * Add https:// if no protocol is present.
 * Does not modify URLs that already have a protocol.
 */
function normalizeUrl(url: string): string {
  if (/^[a-z][a-z0-9+\-.]*:\/\//i.test(url)) return url;
  const protocol = 'https';
  return `${protocol}://${url}`;
}
