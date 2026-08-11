import { SEARCH_MAX_QUERY_LENGTH } from '@/lib/constants';

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface SearchableEntry {
  uuid: string;
  type: 'password' | 'note' | 'pin';
  title: string;
  username: string;
  url: string;
  notes: string;
  tags: string[];
}

export interface SearchEngine {
  index(entries: SearchableEntry[]): void;
  search(query: string): SearchableEntry[];
  clear(): void;
}

// ─── Implementation ────────────────────────────────────────────────────────────

interface IndexedEntry {
  entry: SearchableEntry;
  searchText: string; // pre-computed lowercase concatenation
}

export function createSearchEngine(): SearchEngine {
  let indexed: IndexedEntry[] = [];

  function buildSearchText(entry: SearchableEntry): string {
    return [entry.title, entry.username, entry.url, entry.notes, entry.tags.join(' ')]
      .join(' ')
      .toLowerCase();
  }

  return {
    index(entries: SearchableEntry[]): void {
      indexed = entries.map((entry) => ({
        entry,
        searchText: buildSearchText(entry),
      }));
    },

    search(query: string): SearchableEntry[] {
      const trimmed = query.trim();

      // Empty or whitespace-only query returns all indexed entries
      if (trimmed.length === 0) {
        return indexed.map((item) => item.entry);
      }

      // Truncate to max query length
      const normalizedQuery = trimmed.slice(0, SEARCH_MAX_QUERY_LENGTH).toLowerCase();

      return indexed
        .filter((item) => item.searchText.includes(normalizedQuery))
        .map((item) => item.entry);
    },

    clear(): void {
      indexed = [];
    },
  };
}
