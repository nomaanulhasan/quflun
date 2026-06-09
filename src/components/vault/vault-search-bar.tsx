'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SEARCH_MAX_QUERY_LENGTH } from '@/lib/constants';

interface VaultSearchBarProps {
  query: string;
  onChange: (query: string) => void;
}

export function VaultSearchBar({ query, onChange }: VaultSearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        type="search"
        placeholder="Search entries..."
        value={query}
        onChange={(e) => onChange((e.target as HTMLInputElement).value)}
        className="pl-9 pr-9"
        aria-label="Search entries"
        maxLength={SEARCH_MAX_QUERY_LENGTH}
      />
      {query && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
