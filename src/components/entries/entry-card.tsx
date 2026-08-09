'use client';

import { Star, StickyNote, ExternalLink, Clipboard, Check, User, KeyRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCopyAction } from '@/hooks/use-copy-action';
import type { EntryListItem } from '@/types';

interface EntryCardProps {
  entry: EntryListItem;
  onClick?: () => void;
}

/**
 * Entry card for the vault list view.
 * Displays title, username, URL, tags, favorite status, and quick action buttons.
 * Does NOT display passwords.
 */
export function EntryCard({ entry, onClick }: EntryCardProps) {
  const titleId = `entry-title-${entry.uuid}`;
  const { copy, isCopied } = useCopyAction();

  async function handleCopyPassword(e: React.MouseEvent) {
    e.stopPropagation();
    // Fetch full entry from engine to get password (not in EntryListItem)
    const { getServices } = await import('@/lib/runtime');
    const { engine } = await getServices();
    const full = engine.getEntry(entry.uuid);
    if (full.password) {
      await copy(full.password, 'Password', `pw-${entry.uuid}`);
    }
  }

  async function handleCopyUsername(e: React.MouseEvent) {
    e.stopPropagation();
    if (entry.username) {
      await copy(entry.username, 'Username', `un-${entry.uuid}`);
    }
  }

  async function handleCopyUrl(e: React.MouseEvent) {
    e.stopPropagation();
    if (entry.url) {
      await copy(entry.url, 'URL', `url-${entry.uuid}`);
    }
  }

  function handleOpenUrl(e: React.MouseEvent) {
    e.stopPropagation();
    if (entry.url) {
      const protocol = 'https';
      const href = /^[a-z][a-z0-9+\-.]*:\/\//i.test(entry.url) ? entry.url : `${protocol}://${entry.url}`;
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <article
      aria-labelledby={titleId}
      className="group cursor-pointer rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent/50 focus-within:ring-2 focus-within:ring-ring"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      tabIndex={0}
      role="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          {/* Title */}
          <div className="flex items-center gap-2">
            {entry.type === 'note' && (
              <StickyNote className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="Secure note" />
            )}
            <h3 id={titleId} className="truncate text-sm font-medium text-foreground">
              {entry.title}
            </h3>
          </div>

          {/* Username */}
          {entry.username && (
            <p className="truncate text-xs text-muted-foreground">{entry.username}</p>
          )}

          {/* URL */}
          {entry.url && (
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{entry.url}</span>
            </p>
          )}

          {/* Tags */}
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {entry.tags.slice(0, 5).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
              {entry.tags.length > 5 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  +{entry.tags.length - 5}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Right side: favorite + actions */}
        <div className="flex flex-col items-end gap-1.5">
          {entry.favorite && (
            <Star
              className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400"
              aria-label="Favorite"
            />
          )}
        </div>
      </div>

      {/* Quick actions — only for password entries */}
      {entry.type === 'password' && (
        <div className="mt-3 flex items-center gap-1 border-t border-border pt-2" onClick={(e) => e.stopPropagation()}>
          {entry.username && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Copy username"
              onClick={handleCopyUsername}
            >
              {isCopied(`un-${entry.uuid}`) ? (
                <Check className="h-3 w-3 text-green-500" aria-hidden="true" />
              ) : (
                <User className="h-3 w-3" aria-hidden="true" />
              )}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Copy password"
            onClick={handleCopyPassword}
          >
            {isCopied(`pw-${entry.uuid}`) ? (
              <Check className="h-3 w-3 text-green-500" aria-hidden="true" />
            ) : (
              <KeyRound className="h-3 w-3" aria-hidden="true" />
            )}
          </Button>
          {entry.url && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Copy URL"
                onClick={handleCopyUrl}
              >
                {isCopied(`url-${entry.uuid}`) ? (
                  <Check className="h-3 w-3 text-green-500" aria-hidden="true" />
                ) : (
                  <Clipboard className="h-3 w-3" aria-hidden="true" />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Open website"
                onClick={handleOpenUrl}
              >
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </Button>
            </>
          )}
        </div>
      )}
    </article>
  );
}
