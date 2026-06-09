'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { SearchEngine, SearchableEntry } from '@/lib/search';

/**
 * useSearch — wraps SearchEngine with debounced query input.
 *
 * Does not duplicate search logic.
 * SearchEngine remains the source of truth for matching.
 *
 * @param engine - The SearchEngine instance
 * @param debounceMs - Debounce delay in milliseconds (default 150ms)
 */
export function useSearch(engine: SearchEngine, debounceMs = 150) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchableEntry[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(
    (q: string) => {
      const searchResults = engine.search(q);
      setResults(searchResults);
    },
    [engine]
  );

  const updateQuery = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      if (debounceMs <= 0) {
        performSearch(newQuery);
        return;
      }

      timerRef.current = setTimeout(() => {
        performSearch(newQuery);
        timerRef.current = null;
      }, debounceMs);
    },
    [debounceMs, performSearch]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const clearQuery = useCallback(() => {
    setQuery('');
    performSearch('');
  }, [performSearch]);

  return {
    query,
    results,
    setQuery: updateQuery,
    clearQuery,
  };
}
