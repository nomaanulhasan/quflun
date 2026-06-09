'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Star, X, FolderOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useVaultStore } from '@/components/providers';
import { Shell } from '@/components/layout/shell';
import { EntryCard } from '@/components/entries/entry-card';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { TagFilter } from '@/components/filters/tag-filter';
import { CategoryFilter } from '@/components/filters/category-filter';
import { SEARCH_MAX_QUERY_LENGTH } from '@/lib/constants';
import type { EntryListItem } from '@/types';

export default function VaultPage() {
  const status = useVaultStore((s) => s.status);
  const entries = useVaultStore((s) => s.entries);
  const router = useRouter();

  useEffect(() => {
    if (status === 'locked') router.replace('/');
  }, [status, router]);

  if (status !== 'unlocked') return null;

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

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) { if (e.category) set.add(e.category); }
    return [...set].sort();
  }, [entries]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) { for (const t of e.tags) set.add(t); }
    return [...set].sort();
  }, [entries]);

  const filtered = useMemo(() => {
    let result = entries;
    if (showFavorites) result = result.filter((e) => e.favorite);
    if (selectedCategory) result = result.filter((e) => e.category === selectedCategory);
    if (selectedTag) result = result.filter((e) => e.tags.includes(selectedTag));
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
      <PageHeader
        title="Vault"
        subtitle={`${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}
      />

      {/* Search */}
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

      {/* Filters */}
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

        <CategoryFilter categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
        <TagFilter tags={tags} selected={selectedTag} onSelect={setSelectedTag} />

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
            Clear filters
          </Button>
        )}
      </div>

      {/* Content */}
      {entries.length === 0 ? (
        <EmptyState icon={FolderOpen} title="Your vault is empty" description="Add your first credential to get started." />
      ) : filtered.length === 0 ? (
        showFavorites
          ? <EmptyState icon={Star} title="No favorites yet" description="Star entries for quick access." />
          : <EmptyState icon={Search} title="No entries match your search" description="Try a different query or clear your filters." />
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
