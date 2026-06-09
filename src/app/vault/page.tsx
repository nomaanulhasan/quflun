'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Star, X, FolderOpen, StickyNote } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useVaultStore } from '@/components/providers';
import { Shell } from '@/components/layout/shell';
import { EntryCard } from '@/components/entries/entry-card';
import { SEARCH_MAX_QUERY_LENGTH } from '@/lib/constants';
import type { EntryListItem } from '@/types';

/**
 * Vault entry list — search, filter, and browse entries.
 */
export default function VaultPage() {
  const status = useVaultStore((s) => s.status);
  const entries = useVaultStore((s) => s.entries);
  const router = useRouter();

  // Redirect to home if locked
  useEffect(() => {
    if (status === 'locked') {
      router.replace('/');
    }
  }, [status, router]);

  if (status !== 'unlocked') {
    return null;
  }

  return (
    <Shell>
      <EntryListView entries={entries} />
    </Shell>
  );
}

// ─── Entry List View ───────────────────────────────────────────────────────────

function EntryListView({ entries }: { entries: EntryListItem[] }) {
  const [query, setQuery] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Derive categories and tags from entries
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) {
      if (e.category) set.add(e.category);
    }
    return [...set].sort();
  }, [entries]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) {
      for (const t of e.tags) set.add(t);
    }
    return [...set].sort();
  }, [entries]);

  // Filter entries
  const filtered = useMemo(() => {
    let result = entries;

    // Favorites filter
    if (showFavorites) {
      result = result.filter((e) => e.favorite);
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter((e) => e.category === selectedCategory);
    }

    // Tag filter
    if (selectedTag) {
      result = result.filter((e) => e.tags.includes(selectedTag));
    }

    // Search filter (case-insensitive substring)
    if (query.trim()) {
      const q = query.trim().toLowerCase().slice(0, SEARCH_MAX_QUERY_LENGTH);
      result = result.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        e.username.toLowerCase().includes(q) ||
        e.url.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return result;
  }, [entries, query, showFavorites, selectedCategory, selectedTag]);

  const hasActiveFilters = showFavorites || selectedCategory || selectedTag;

  function clearFilters() {
    setShowFavorites(false);
    setSelectedCategory(null);
    setSelectedTag(null);
    setQuery('');
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Vault</h1>
        <span className="text-sm text-muted-foreground">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          placeholder="Search entries..."
          value={query}
          onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
          className="pl-9 pr-9"
          aria-label="Search entries"
          maxLength={SEARCH_MAX_QUERY_LENGTH}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={showFavorites ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFavorites(!showFavorites)}
          className="gap-1.5"
        >
          <Star className={`h-3.5 w-3.5 ${showFavorites ? 'fill-current' : ''}`} aria-hidden="true" />
          Favorites
        </Button>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className="gap-1.5"
              >
                <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
                {cat}
              </Button>
            ))}
          </div>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 10).map((tag) => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              >
                {tag}
              </Badge>
            ))}
            {tags.length > 10 && (
              <Badge variant="secondary">+{tags.length - 10}</Badge>
            )}
          </div>
        )}

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
            Clear filters
          </Button>
        )}
      </div>

      {/* Entry list or empty state */}
      {entries.length === 0 ? (
        <EmptyVault />
      ) : filtered.length === 0 ? (
        showFavorites ? <EmptyFavorites /> : <EmptySearch />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry) => (
            <EntryCard key={entry.uuid} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Empty States ──────────────────────────────────────────────────────────────

function EmptyVault() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <FolderOpen className="h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-medium">Your vault is empty</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Add your first credential to get started.
      </p>
    </div>
  );
}

function EmptySearch() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Search className="h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-medium">No entries match your search</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Try a different query or clear your filters.
      </p>
    </div>
  );
}

function EmptyFavorites() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Star className="h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-medium">No favorites yet</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Star entries for quick access.
      </p>
    </div>
  );
}
