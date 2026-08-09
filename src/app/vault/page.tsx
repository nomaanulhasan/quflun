'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FolderOpen, Star, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVaultStore } from '@/components/providers';
import { Shell } from '@/components/layout/shell';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { EntryCard } from '@/components/entries/entry-card';
import { VaultSearchBar } from '@/components/vault/vault-search-bar';
import { VaultFilters } from '@/components/vault/vault-filters';
import { EditEntryForm } from '@/components/vault/edit-entry-form';
import { EditNoteForm } from '@/components/vault/edit-note-form';
import { useBackupReminder } from '@/hooks/use-backup-reminder';
import { SEARCH_MAX_QUERY_LENGTH } from '@/lib/constants';
import type { EntryListItem, VaultEntry } from '@/types';

import { LockScreen } from '@/components/layout/lock-screen';

export default function VaultPage() {
  const status = useVaultStore((s) => s.status);
  const vaultId = useVaultStore((s) => s.vaultId);
  const entries = useVaultStore((s) => s.entries);
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCounter, setEditCounter] = useState(0);

  // Show backup reminder toast when vault is unlocked and interval exceeded
  useBackupReminder();

  function openEditor(id: string) {
    setEditingId(id);
    setEditCounter((c) => c + 1);
  }

  // All hooks called above — early returns below are safe
  useEffect(() => {
    if (status === 'locked' && !vaultId) router.replace('/');
  }, [status, vaultId, router]);

  // If locked with a vault loaded, show lock screen
  if (status === 'locked' && vaultId) {
    return <LockScreen />;
  }

  if (status !== 'unlocked') return null;

  if (editingId) {
    return (
      <Shell>
        <EntryEditorWrapper key={`${editingId}-${editCounter}`} entryId={editingId} onBack={() => setEditingId(null)} />
      </Shell>
    );
  }

  return (
    <Shell>
      <VaultListView entries={entries} onEdit={openEditor} onNew={() => router.push('/vault/new')} />
    </Shell>
  );
}

// ─── List View ─────────────────────────────────────────────────────────────────

function VaultListView({ entries, onEdit, onNew }: { entries: EntryListItem[]; onEdit: (id: string) => void; onNew: () => void }) {
  const [query, setQuery] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const categories = useMemo(() => [...new Set(entries.map((e) => e.category).filter(Boolean) as string[])].sort(), [entries]);
  const tags = useMemo(() => [...new Set(entries.flatMap((e) => e.tags))].sort(), [entries]);

  const filtered = useMemo(() => {
    let r = entries;
    if (showFavorites) r = r.filter((e) => e.favorite);
    if (selectedCategory) r = r.filter((e) => e.category === selectedCategory);
    if (selectedTag) r = r.filter((e) => e.tags.includes(selectedTag));
    if (query.trim()) {
      const q = query.trim().toLowerCase().slice(0, SEARCH_MAX_QUERY_LENGTH);
      r = r.filter((e) => e.title.toLowerCase().includes(q) || e.username.toLowerCase().includes(q) || e.url.toLowerCase().includes(q) || e.tags.some((t) => t.toLowerCase().includes(q)));
    }
    return r;
  }, [entries, query, showFavorites, selectedCategory, selectedTag]);

  const hasFilters = showFavorites || !!selectedCategory || !!selectedTag;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PageHeader title="Vault" subtitle={`${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`} />
        <Button size="sm" onClick={onNew} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add</Button>
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
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((e) => <EntryCard key={e.uuid} entry={e} onClick={() => onEdit(e.uuid)} />)}
        </div>
      )}
    </div>
  );
}

// ─── Editor Wrapper ────────────────────────────────────────────────────────────

function EntryEditorWrapper({ entryId, onBack }: { entryId: string; onBack: () => void }) {
  const [entry, setEntry] = useState<VaultEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { getServices } = await import('@/lib/runtime');
        const { engine } = await getServices();
        setEntry(engine.getEntry(entryId));
      } catch (err) { setError((err as Error).message); }
    })();
  }, [entryId]);

  if (error) return <p className="py-8 text-center text-sm text-destructive">{error}</p>;
  if (!entry) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <PageHeader title={entry.type === 'note' ? 'Edit Note' : 'Edit Entry'} />
      {entry.type === 'note' ? <EditNoteForm entry={entry} onBack={onBack} /> : <EditEntryForm entry={entry} onBack={onBack} />}
    </div>
  );
}
