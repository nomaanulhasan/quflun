'use client';

import { Star, StickyNote, ExternalLink, Clipboard, Check, User, KeyRound, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCopyAction } from '@/hooks/use-copy-action';
import { useVaultStore } from '@/components/providers';
import type { EntryListItem } from '@/types';

interface EntryCardProps {
  entry: EntryListItem;
  onClick?: () => void;
  /** Whether this card is keyboard-selected in the list */
  selected?: boolean;
}

/**
 * Entry card for the vault list view.
 * Layout: Avatar + title/username (top), quick actions + strength badge (bottom).
 */
export function EntryCard({ entry, onClick, selected }: EntryCardProps) {
  const titleId = `entry-title-${entry.uuid}`;
  const { copy, isCopied } = useCopyAction();
  const setFavorite = useVaultStore((s) => s.setFavorite);

  async function handleToggleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    await setFavorite(entry.uuid, !entry.favorite);
  }

  async function handleCopyPassword(e: React.MouseEvent) {
    e.stopPropagation();
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
      data-entry-card
      className={`group cursor-pointer rounded-lg border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent/50 focus-within:ring-2 focus-within:ring-ring ${
        selected ? 'border-primary ring-2 ring-ring' : 'border-border'
      }`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      tabIndex={selected ? 0 : -1}
      role="button"
      aria-selected={selected}
    >
      {/* ─── Top: Avatar + Info + Favorite ─── */}
      <div className="flex items-start gap-3">
        <EntryAvatar title={entry.title} url={entry.url} type={entry.type} />
        <div className="min-w-0 flex-1">
          <h3 id={titleId} className="truncate text-sm font-semibold leading-snug text-foreground">
            {entry.title}
          </h3>
          {entry.username ? (
            <p className="truncate text-xs text-muted-foreground mt-0.5">{entry.username}</p>
          ) : entry.type === 'note' ? (
            <p className="truncate text-xs text-muted-foreground mt-0.5">
              Updated {formatRelativeDate(entry.modifiedAt)}
            </p>
          ) : entry.url ? (
            <p className="truncate text-xs text-muted-foreground mt-0.5">{entry.url}</p>
          ) : null}
        </div>
        <button
          type="button"
          title={entry.favorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-label={entry.favorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-pressed={entry.favorite}
          onClick={handleToggleFavorite}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Star
            className={`h-4 w-4 ${entry.favorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* ─── Bottom: Quick actions + Strength badge ─── */}
      {entry.type === 'password' && (
        <div
          className="mt-3 flex items-center justify-between border-t border-border pt-2"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-0.5">
            {entry.username && (
              <Button type="button" variant="ghost" size="icon" title="Copy username" aria-label="Copy username" className="h-9 w-9" onClick={handleCopyUsername}>
                {isCopied(`un-${entry.uuid}`) ? <Check className="h-4 w-4 text-green-500" aria-hidden="true" /> : <User className="h-4 w-4" aria-hidden="true" />}
              </Button>
            )}
            <Button type="button" variant="ghost" size="icon" title="Copy password" aria-label="Copy password" className="h-9 w-9" onClick={handleCopyPassword}>
              {isCopied(`pw-${entry.uuid}`) ? <Check className="h-4 w-4 text-green-500" aria-hidden="true" /> : <KeyRound className="h-4 w-4" aria-hidden="true" />}
            </Button>
            {entry.url && (
              <>
                <Button type="button" variant="ghost" size="icon" title="Copy URL" aria-label="Copy URL" className="h-9 w-9" onClick={handleCopyUrl}>
                  {isCopied(`url-${entry.uuid}`) ? <Check className="h-4 w-4 text-green-500" aria-hidden="true" /> : <Clipboard className="h-4 w-4" aria-hidden="true" />}
                </Button>
                <Button type="button" variant="ghost" size="icon" title="Open website" aria-label="Open website" className="h-9 w-9" onClick={handleOpenUrl}>
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </Button>
              </>
            )}
          </div>
          <StrengthBadge strength={entry.passwordStrength} />
        </div>
      )}

      {/* Secure note indicator */}
      {entry.type === 'note' && (
        <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-5 text-xs text-muted-foreground">
          <StickyNote className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Secure note</span>
        </div>
      )}
    </article>
  );
}

// ─── Entry Avatar ──────────────────────────────────────────────────────────────

function EntryAvatar({ title, url, type }: { title: string; url: string; type: 'password' | 'note' }) {
  const initials = getInitials(title);
  const bgColor = getAvatarColor(url || title);

  if (type === 'note') {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        <StickyNote className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bgColor}`}>
      <span className="text-xs font-semibold text-foreground/70 select-none">{initials}</span>
    </div>
  );
}

function getInitials(title: string): string {
  const words = title.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return title.slice(0, 2).toUpperCase();
}

/** Deterministic soft background color based on string content. */
function getAvatarColor(input: string): string {
  const colors = [
    'bg-blue-100 dark:bg-blue-900/30',
    'bg-purple-100 dark:bg-purple-900/30',
    'bg-pink-100 dark:bg-pink-900/30',
    'bg-emerald-100 dark:bg-emerald-900/30',
    'bg-amber-100 dark:bg-amber-900/30',
    'bg-cyan-100 dark:bg-cyan-900/30',
    'bg-rose-100 dark:bg-rose-900/30',
    'bg-indigo-100 dark:bg-indigo-900/30',
  ];
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

// ─── Password Strength Badge ───────────────────────────────────────────────────

function StrengthBadge({ strength }: { strength: 'weak' | 'fair' | 'strong' | null }) {
  if (!strength) return null;

  const config = {
    weak: { icon: ShieldAlert, label: 'Weak', className: 'text-red-500 bg-red-500/10' },
    fair: { icon: Shield, label: 'Fair', className: 'text-amber-500 bg-amber-500/10' },
    strong: { icon: ShieldCheck, label: 'Strong', className: 'text-green-500 bg-green-500/10' },
  } as const;

  const { icon: Icon, label, className } = config[strength];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${className}`}
      title={`Password strength: ${label}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  );
}

// ─── Date Formatting ───────────────────────────────────────────────────────────

function formatRelativeDate(iso: string): string {
  if (!iso) return 'recently';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}
