'use client';

import { Star, StickyNote, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { EntryListItem } from '@/types';

interface EntryCardProps {
  entry: EntryListItem;
  onClick?: () => void;
}

/**
 * Entry card for the vault list view.
 * Displays title, username, URL, tags, favorite status, and note indicator.
 * Does NOT display passwords.
 */
export function EntryCard({ entry, onClick }: EntryCardProps) {
  const titleId = `entry-title-${entry.uuid}`;

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

        {/* Favorite indicator */}
        {entry.favorite && (
          <Star
            className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400"
            aria-label="Favorite"
          />
        )}
      </div>
    </article>
  );
}
