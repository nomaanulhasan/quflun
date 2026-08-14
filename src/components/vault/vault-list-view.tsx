'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FolderOpen, Star, Search, Plus, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { ScrollFade } from '@/components/common/scroll-fade';
import { EntryCard } from '@/components/entries/entry-card';
import { VaultSearchBar } from '@/components/vault/vault-search-bar';
import { VaultFilters } from '@/components/vault/vault-filters';
import { BulkActionBar } from '@/components/vault/bulk-action-bar';
import { SEARCH_MAX_QUERY_LENGTH } from '@/lib/constants';
import type { EntryListItem } from '@/types';

// Page size adapts to screen
function getPageSize(): number {
  if (typeof window === 'undefined') return 24;
  const width = window.innerWidth;
  if (width < 768) return 8;
  if (width < 1024) return 10;
  if (width < 1536) return 12;
  return 20;
}

interface VaultListViewProps {
  entries: EntryListItem[];
  onEdit: (id: string) => void;
  onNew: () => void;
}

export function VaultListView({ entries, onEdit, onNew }: VaultListViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const folderParam = searchParams.get('folder');

  const [query, setQuery] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(folderParam);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [visibleCount, setVisibleCount] = useState(() => getPageSize());
  const pageSize = useRef(getPageSize());
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Selection mode
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sync folder query param → selectedCategory
  useEffect(() => {
    setSelectedCategory(folderParam);
  }, [folderParam]);

  // Refs for stable keyboard handler
  const selectedIndexRef = useRef(selectedIndex);
  selectedIndexRef.current = selectedIndex;
  const onEditRef = useRef(onEdit);
  onEditRef.current = onEdit;

  const categories = useMemo(
    () => [...new Set(entries.map((e) => e.category).filter(Boolean) as string[])].sort(),
    [entries]
  );
  const tags = useMemo(() => [...new Set(entries.flatMap((e) => e.tags))].sort(), [entries]);

  const filtered = useMemo(() => {
    let r = entries;
    if (showFavorites) r = r.filter((e) => e.favorite);
    if (selectedCategory === '') {
      r = r.filter((e) => !e.category);
    } else if (selectedCategory) {
      r = r.filter((e) => e.category === selectedCategory);
    }
    if (selectedTag) r = r.filter((e) => e.tags.includes(selectedTag));
    if (query.trim()) {
      const q = query.trim().toLowerCase().slice(0, SEARCH_MAX_QUERY_LENGTH);
      r = r.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.username.toLowerCase().includes(q) ||
          e.url.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return r;
  }, [entries, query, showFavorites, selectedCategory, selectedTag]);

  const hasFilters = showFavorites || selectedCategory !== null || !!selectedTag;
  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  // Infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sentinelRef.current || !scrollContainerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && visibleCount < filtered.length) {
          setVisibleCount((c) => c + pageSize.current);
        }
      },
      { root: scrollContainerRef.current, rootMargin: '200px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [visibleCount, filtered.length]);

  // Reset on filter change
  useEffect(() => {
    setSelectedIndex(-1);
    setVisibleCount(pageSize.current);
  }, [filtered.length, query, showFavorites, selectedCategory, selectedTag]);

  // Scroll selected card into view
  useEffect(() => {
    if (selectedIndex < 0 || !gridRef.current) return;
    const cards = gridRef.current.querySelectorAll('[data-entry-card]');
    cards[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // Keyboard handler (stable — never re-creates)
  const handleListKeyDown = useCallback((e: React.KeyboardEvent) => {
    const list = visibleRef.current;
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
  }, []);

  function toggleSelection(uuid: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* Sticky header */}
      <div className="shrink-0 space-y-4 pr-4 pb-4 md:pr-6">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Vault"
            subtitle={`${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}
          />
          <div className="flex items-center gap-2">
            {entries.length > 0 && (
              <Button
                variant={selectionMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  if (selectionMode) {
                    exitSelectionMode();
                  } else {
                    setSelectionMode(true);
                  }
                }}
                className="gap-1.5"
              >
                <CheckSquare className="h-3.5 w-3.5" aria-hidden="true" />
                {selectionMode ? 'Done' : 'Select'}
              </Button>
            )}
            <Button onClick={onNew}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>
                Add New <span className="hidden sm:inline">Entry</span>
              </span>
            </Button>
          </div>
        </div>
        <VaultSearchBar query={query} onChange={setQuery} />
        <VaultFilters
          showFavorites={showFavorites}
          onToggleFavorites={() => setShowFavorites(!showFavorites)}
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            if (cat) {
              router.replace(`/vault?folder=${encodeURIComponent(cat)}`);
            } else {
              router.replace('/vault');
            }
          }}
          tags={tags}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          hasActiveFilters={hasFilters}
          onClearFilters={() => {
            setShowFavorites(false);
            setSelectedCategory(null);
            setSelectedTag(null);
            setQuery('');
            if (folderParam) router.replace('/vault');
          }}
        />
      </div>

      {/* Scrollable card grid */}
      <ScrollFade
        direction="vertical"
        scrollRef={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto pr-4 sm:pr-6"
      >
        {entries.length === 0 ? (
          <div className="flex flex-col items-center gap-4 pt-12">
            <EmptyState
              icon={FolderOpen}
              title="Your vault is empty"
              description="Add your first credential to get started."
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="pt-12">
            {showFavorites ? (
              <EmptyState
                icon={Star}
                title="No favorites yet"
                description="Star entries for quick access."
              />
            ) : (
              <EmptyState
                icon={Search}
                title="No results"
                description="Try a different query or clear filters."
              />
            )}
          </div>
        ) : (
          <>
            <div
              ref={gridRef}
              className="grid gap-3 pb-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
              role="grid"
              aria-label="Vault entries"
              tabIndex={0}
              onKeyDown={handleListKeyDown}
            >
              {visible.map((e, idx) => (
                <EntryCard
                  key={e.uuid}
                  entry={e}
                  onClick={() => onEdit(e.uuid)}
                  selected={idx === selectedIndex}
                  selectable={selectionMode}
                  checked={selectedIds.has(e.uuid)}
                  onToggleCheck={() => toggleSelection(e.uuid)}
                />
              ))}
              {!hasMore && (
                <Button
                  variant="outline"
                  onClick={onNew}
                  className="border-border text-muted-foreground hover:border-primary/40 hover:bg-accent/50 hover:text-foreground flex h-auto cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6"
                  aria-label="Add new entry"
                >
                  <Plus className="h-6 w-6" aria-hidden="true" />
                  <span className="text-sm font-medium">New Entry</span>
                </Button>
              )}
            </div>
            {hasMore && <div ref={sentinelRef} className="h-1" aria-hidden="true" />}
          </>
        )}
      </ScrollFade>

      {/* Bulk action bar */}
      {selectionMode && selectedIds.size > 0 && (
        <BulkActionBar
          selectedIds={selectedIds}
          onClearSelection={exitSelectionMode}
          onComplete={exitSelectionMode}
        />
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
    // Silently fail
  }
}
