'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { FolderOpen, Star, Search, Plus } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { EntryCard } from '@/components/entries/entry-card';
import { VaultSearchBar } from '@/components/vault/vault-search-bar';
import { VaultFilters } from '@/components/vault/vault-filters';
import { SEARCH_MAX_QUERY_LENGTH } from '@/lib/constants';
import type { EntryListItem } from '@/types';

interface VaultListViewProps {
  entries: EntryListItem[];
  onEdit: (id: string) => void;
  onNew: () => void;
}

export function VaultListView({ entries, onEdit, onNew }: VaultListViewProps) {
  const [query, setQuery] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const gridRef = useRef<HTMLDivElement>(null);

  // Refs for keyboard handler to avoid re-creation on every state change
  const selectedIndexRef = useRef(selectedIndex);
  selectedIndexRef.current = selectedIndex;
  const onEditRef = useRef(onEdit);
  onEditRef.current = onEdit;

  const categories = useMemo(
    () => [...new Set(entries.map((e) => e.category).filter(Boolean) as string[])].sort(),
    [entries]
  );
  const tags = useMemo(
    () => [...new Set(entries.flatMap((e) => e.tags))].sort(),
    [entries]
  );

  const filtered = useMemo(() => {
    let r = entries;
    if (showFavorites) r = r.filter((e) => e.favorite);
    if (selectedCategory) r = r.filter((e) => e.category === selectedCategory);
    if (selectedTag) r = r.filter((e) => e.tags.includes(selectedTag));
    if (query.trim()) {
      const q = query.trim().toLowerCase().slice(0, SEARCH_MAX_QUERY_LENGTH);
      r = r.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        e.username.toLowerCase().includes(q) ||
        e.url.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return r;
  }, [entries, query, showFavorites, selectedCategory, selectedTag]);

  const filteredRef = useRef(filtered);
  filteredRef.current = filtered;

  const hasFilters = showFavorites || !!selectedCategory || !!selectedTag;

  // Reset selection when filter results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [filtered.length, query, showFavorites, selectedCategory, selectedTag]);

  // Scroll selected card into view
  useEffect(() => {
    if (selectedIndex < 0 || !gridRef.current) return;
    const cards = gridRef.current.querySelectorAll('[data-entry-card]');
    cards[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // Stable keyboard handler — uses refs so it never re-creates
  const handleListKeyDown = useCallback((e: React.KeyboardEvent) => {
    const list = filteredRef.current;
    if (list.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, list.length - 1));
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndexRef.current >= 0 && list[selectedIndexRef.current]) {
          onEditRef.current(list[selectedIndexRef.current].uuid);
        }
        break;
      case ' ':
        e.preventDefault();
        if (selectedIndexRef.current >= 0 && list[selectedIndexRef.current]) {
          copyPasswordForEntry(list[selectedIndexRef.current].uuid);
        }
        break;
      case 'Home':
        e.preventDefault();
        setSelectedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setSelectedIndex(list.length - 1);
        break;
    }
  }, []); // stable — never re-creates

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PageHeader title="Vault" subtitle={`${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`} />
      </div>
      <VaultSearchBar query={query} onChange={setQuery} />
      <VaultFilters
        showFavorites={showFavorites} onToggleFavorites={() => setShowFavorites(!showFavorites)}
        categories={categories} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory}
        tags={tags} selectedTag={selectedTag} onSelectTag={setSelectedTag}
        hasActiveFilters={hasFilters} onClearFilters={() => { setShowFavorites(false); setSelectedCategory(null); setSelectedTag(null); setQuery(''); }}
      />
      {entries.length === 0 ? (
        <EmptyState icon={FolderOpen} title="Your vault is empty" description="Add your first credential to get started." />
      ) : filtered.length === 0 ? (
        showFavorites ? <EmptyState icon={Star} title="No favorites yet" description="Star entries for quick access." />
          : <EmptyState icon={Search} title="No results" description="Try a different query or clear filters." />
      ) : (
        <div
          ref={gridRef}
          className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
          role="grid"
          aria-label="Vault entries"
          tabIndex={0}
          onKeyDown={handleListKeyDown}
        >
          {filtered.map((e, idx) => (
            <EntryCard
              key={e.uuid}
              entry={e}
              onClick={() => onEdit(e.uuid)}
              selected={idx === selectedIndex}
            />
          ))}
          <button
            type="button"
            onClick={onNew}
            className="flex flex-col cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Add new entry"
          >
            <Plus className="h-6 w-6" aria-hidden="true" />
            <span className="text-sm font-medium">New Entry</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function copyPasswordForEntry(uuid: string) {
  try {
    const { getServices } = await import('@/lib/runtime');
    const { engine } = await getServices();
    const full = engine.getEntry(uuid);
    if (full.password) {
      await navigator.clipboard.writeText(full.password);
    }
  } catch {
    // Silently fail — user can use the card action instead
  }
}
