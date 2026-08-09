'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search } from 'lucide-react';
import { fuzzyFilter } from '@/lib/search/fuzzy-search';
import { usePaletteItems } from './use-palette-items';
import { PaletteItemRow } from './palette-item';
import type { PaletteSection } from './types';

const SECTION_LABELS: Record<string, string> = { actions: 'Actions', navigation: 'Navigation', entries: 'Entries' };

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allItems = usePaletteItems(open, onClose);

  const filtered = useMemo(
    () => fuzzyFilter(allItems, query, (item) => item.subtitle ? `${item.label} ${item.subtitle}` : item.label),
    [allItems, query]
  );

  const sections: PaletteSection[] = useMemo(() => {
    const groups: PaletteSection[] = [];
    let current: PaletteSection | null = null;
    for (let i = 0; i < filtered.length; i++) {
      const item = filtered[i];
      if (!current || current.section !== item.section) {
        current = { section: item.section, items: [] };
        groups.push(current);
      }
      current.items.push({ item, index: i });
    }
    return groups;
  }, [filtered]);

  useEffect(() => { setSelectedIndex(0); }, [filtered.length, query]);

  useEffect(() => {
    if (open) { setQuery(''); setSelectedIndex(0); requestAnimationFrame(() => inputRef.current?.focus()); }
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setSelectedIndex((i) => (i + 1) % Math.max(filtered.length, 1)); break;
      case 'ArrowUp': e.preventDefault(); setSelectedIndex((i) => (i - 1 + filtered.length) % Math.max(filtered.length, 1)); break;
      case 'Enter': e.preventDefault(); filtered[selectedIndex]?.action(); break;
      case 'Escape': e.preventDefault(); onClose(); break;
    }
  }, [filtered, selectedIndex, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" role="presentation">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-label="Command palette" aria-modal="true" className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-border bg-popover shadow-2xl">
        {/* Search */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search entries and actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            aria-label="Command palette search"
            aria-activedescendant={filtered[selectedIndex] ? `palette-item-${filtered[selectedIndex].id}` : undefined}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-autocomplete="list"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Esc</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} id="palette-list" role="listbox" className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No results found.</p>
          ) : (
            sections.map(({ section, items }) => (
              <div key={section}>
                <p className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">{SECTION_LABELS[section] ?? section}</p>
                {items.map(({ item, index }) => (
                  <PaletteItemRow key={item.id} item={item} index={index} isSelected={index === selectedIndex} onSelect={setSelectedIndex} />
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><kbd className="rounded border border-border px-1 py-0.5">↑↓</kbd> Navigate</span>
          <span className="flex items-center gap-1"><kbd className="rounded border border-border px-1 py-0.5">↵</kbd> Select</span>
          <span className="flex items-center gap-1"><kbd className="rounded border border-border px-1 py-0.5">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
