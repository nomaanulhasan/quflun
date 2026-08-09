/**
 * Lightweight fuzzy search for the command palette.
 *
 * Matches characters in order (not necessarily contiguous).
 * Returns a score — lower is better. Returns -1 for no match.
 */
export function fuzzyScore(query: string, target: string): number {
  if (!query) return 0;

  const q = query.toLowerCase();
  const t = target.toLowerCase();

  let score = 0;
  let qi = 0;
  let lastMatchIdx = -1;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      // Bonus for consecutive matches
      const consecutive = lastMatchIdx === ti - 1 ? 0 : ti - (lastMatchIdx + 1);
      score += consecutive;
      lastMatchIdx = ti;
      qi++;
    }
  }

  // All query chars must match
  if (qi < q.length) return -1;

  // Bonus: exact prefix match gets best score
  if (t.startsWith(q)) return -target.length; // negative = best

  return score;
}

/**
 * Fuzzy-filter and sort an array of items.
 */
export function fuzzyFilter<T>(
  items: T[],
  query: string,
  getText: (item: T) => string
): T[] {
  if (!query.trim()) return items;

  const scored = items
    .map((item) => ({ item, score: fuzzyScore(query, getText(item)) }))
    .filter(({ score }) => score !== -1)
    .sort((a, b) => a.score - b.score);

  return scored.map(({ item }) => item);
}
