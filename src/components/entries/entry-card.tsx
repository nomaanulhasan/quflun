'use client';

import { useState, useEffect } from 'react';
import {
  Star,
  StickyNote,
  ExternalLink,
  Clipboard,
  Check,
  User,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Hash,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCopyAction } from '@/hooks/use-copy-action';
import { useVaultStore } from '@/components/providers';
import type { EntryListItem } from '@/types';

interface EntryCardProps {
  entry: EntryListItem;
  onClick?: () => void;
  /** Whether this card is keyboard-selected in the list */
  selected?: boolean;
  /** Whether selection mode is active (shows checkbox) */
  selectable?: boolean;
  /** Whether this card is checked in selection mode */
  checked?: boolean;
  /** Callback when checkbox is toggled */
  onToggleCheck?: () => void;
}

/**
 * Entry card for the vault list view.
 * Layout: Avatar + title/username (top), quick actions + strength badge (bottom).
 */
export function EntryCard({
  entry,
  onClick,
  selected,
  selectable,
  checked,
  onToggleCheck,
}: EntryCardProps) {
  const titleId = `entry-title-${entry.uuid}`;
  const { copy, isCopied } = useCopyAction();
  const setFavorite = useVaultStore((s) => s.setFavorite);
  const setCategory = useVaultStore((s) => s.setCategory);
  const [categories, setCategories] = useState<string[]>([]);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  useEffect(() => {
    if (showCategoryMenu) {
      let cancelled = false;
      async function load() {
        const { getServices } = await import('@/lib/runtime');
        const { engine } = await getServices();
        if (!cancelled) setCategories(engine.getCategories());
      }
      load();
      return () => {
        cancelled = true;
      };
    }
  }, [showCategoryMenu]);

  async function handleToggleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    await setFavorite(entry.uuid, !entry.favorite);
  }

  async function handleQuickAssign(cat: string | null) {
    setShowCategoryMenu(false);
    await setCategory(entry.uuid, cat);
  }

  function handleCategoryClick(e: React.MouseEvent) {
    e.stopPropagation();
    setShowCategoryMenu((v) => !v);
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
      const href = /^[a-z][a-z0-9+\-.]*:\/\//i.test(entry.url)
        ? entry.url
        : `${protocol}://${entry.url}`;
      // Block dangerous protocols (javascript:, data:, vbscript:)
      if (/^(https?|ftp):\/\//i.test(href)) {
        // Open in system browser (not PWA webview) by omitting window features
        const newWindow = window.open(href, '_blank');
        if (newWindow) newWindow.opener = null;
      }
    }
  }

  return (
    <article
      aria-labelledby={titleId}
      data-entry-card
      className={`group bg-card hover:border-primary/30 hover:bg-accent/50 focus-within:ring-ring cursor-pointer rounded-lg border p-4 transition-colors focus-within:ring-2 ${
        selected ? 'md:border-primary md:ring-ring border-border md:ring-2' : 'border-border'
      } ${checked ? 'border-primary ring-primary/30 ring-2' : ''}`}
      onClick={selectable ? onToggleCheck : onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (selectable) {
            onToggleCheck?.();
          } else {
            onClick?.();
          }
        }
      }}
      tabIndex={selected ? 0 : -1}
      role="button"
    >
      {/* ─── Top: Avatar + Info + Favorite ─── */}
      <div className="flex items-start gap-3">
        {selectable && (
          <div className="flex h-10 shrink-0 items-center">
            <input
              type="checkbox"
              checked={checked}
              onChange={onToggleCheck}
              onClick={(e) => e.stopPropagation()}
              className="accent-primary h-4 w-4 cursor-pointer rounded border-2"
              aria-label={`Select ${entry.title}`}
            />
          </div>
        )}
        <EntryAvatar title={entry.title} url={entry.url} type={entry.type} />
        <div className="min-w-0 flex-1">
          <h3 id={titleId} className="text-foreground truncate text-sm leading-snug font-semibold">
            {entry.title}
          </h3>
          {entry.username ? (
            <p className="text-muted-foreground mt-0.5 truncate text-xs">{entry.username}</p>
          ) : entry.type === 'note' ? (
            <p className="text-muted-foreground mt-0.5 truncate text-xs">
              Updated {formatRelativeDate(entry.modifiedAt)}
            </p>
          ) : entry.url ? (
            <p className="text-muted-foreground mt-0.5 truncate text-xs">{entry.url}</p>
          ) : null}
        </div>
        <button
          type="button"
          title={entry.favorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-label={entry.favorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-pressed={entry.favorite}
          onClick={handleToggleFavorite}
          className="hover:bg-muted focus-visible:ring-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <Star
            className={`h-4 w-4 ${entry.favorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* ─── Category badge + quick-assign ─── */}
      {(entry.category || showCategoryMenu) && (
        <div
          className="relative mt-2 flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            title="Change category"
            aria-label={`Category: ${entry.category ?? 'Uncategorized'}. Click to change.`}
            onClick={handleCategoryClick}
            className="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors"
          >
            <FolderOpen className="h-3 w-3" aria-hidden="true" />
            {entry.category ?? 'Uncategorized'}
          </button>
          {showCategoryMenu && (
            <CategoryQuickMenu
              categories={categories}
              current={entry.category}
              onSelect={handleQuickAssign}
              onClose={() => setShowCategoryMenu(false)}
            />
          )}
        </div>
      )}

      {/* ─── Bottom: Quick actions + Strength badge ─── */}
      {entry.type === 'password' && (
        <div
          className="border-border mt-3 flex items-center justify-between border-t pt-2"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-0.5">
            {entry.username && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Copy username"
                aria-label="Copy username"
                className="h-9 w-9"
                onClick={handleCopyUsername}
              >
                {isCopied(`un-${entry.uuid}`) ? (
                  <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
                ) : (
                  <User className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Copy password"
              aria-label="Copy password"
              className="h-9 w-9"
              onClick={handleCopyPassword}
            >
              {isCopied(`pw-${entry.uuid}`) ? (
                <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
              ) : (
                <KeyRound className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
            {entry.url && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Copy URL"
                  aria-label="Copy URL"
                  className="h-9 w-9"
                  onClick={handleCopyUrl}
                >
                  {isCopied(`url-${entry.uuid}`) ? (
                    <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
                  ) : (
                    <Clipboard className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Open website"
                  aria-label="Open website"
                  className="h-9 w-9"
                  onClick={handleOpenUrl}
                >
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
        <div className="border-border text-muted-foreground mt-3 flex items-center gap-1.5 border-t pt-5 text-xs">
          <StickyNote className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Secure note</span>
        </div>
      )}

      {/* PIN indicator with copy action */}
      {entry.type === 'pin' && (
        <div
          className="border-border mt-3 flex items-center justify-between border-t pt-2"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Hash className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Application PIN</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Copy PIN"
            aria-label="Copy PIN"
            className="h-9 w-9"
            onClick={handleCopyPassword}
          >
            {isCopied(`pw-${entry.uuid}`) ? (
              <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
            ) : (
              <KeyRound className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      )}
    </article>
  );
}

// ─── Category Quick Menu ────────────────────────────────────────────────────────

function CategoryQuickMenu({
  categories,
  current,
  onSelect,
  onClose,
}: {
  categories: string[];
  current: string | null;
  onSelect: (cat: string | null) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="bg-popover border-border absolute z-10 mt-1 max-h-48 w-40 overflow-y-auto rounded-md border py-1 shadow-md"
      role="listbox"
      aria-label="Select category"
    >
      <button
        type="button"
        role="option"
        aria-selected={current === null}
        className={`hover:bg-accent w-full cursor-pointer px-3 py-1.5 text-left text-xs ${current === null ? 'bg-accent font-medium' : ''}`}
        onClick={() => onSelect(null)}
      >
        Uncategorized
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          role="option"
          aria-selected={current === cat}
          className={`hover:bg-accent w-full cursor-pointer px-3 py-1.5 text-left text-xs ${current === cat ? 'bg-accent font-medium' : ''}`}
          onClick={() => onSelect(cat)}
        >
          {cat}
        </button>
      ))}
      {categories.length === 0 && (
        <p className="text-muted-foreground px-3 py-1.5 text-xs">No categories</p>
      )}
      <button
        type="button"
        className="text-muted-foreground hover:bg-accent w-full cursor-pointer border-t px-3 py-1.5 text-left text-xs"
        onClick={onClose}
      >
        Cancel
      </button>
    </div>
  );
}

// ─── Entry Avatar ──────────────────────────────────────────────────────────────

function EntryAvatar({
  title,
  url,
  type,
}: {
  title: string;
  url: string;
  type: 'password' | 'note' | 'pin';
}) {
  const initials = getInitials(title);
  const bgColor = getAvatarColor(url || title);

  if (type === 'note') {
    return (
      <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
        <StickyNote className="text-muted-foreground h-5 w-5" aria-hidden="true" />
      </div>
    );
  }

  if (type === 'pin') {
    return (
      <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
        <Hash className="text-muted-foreground h-5 w-5" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bgColor}`}>
      <span className="text-foreground/70 text-xs font-semibold select-none">{initials}</span>
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
