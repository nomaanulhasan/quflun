'use client';

import { Badge } from '@/components/ui/badge';

interface TagFilterProps {
  tags: string[];
  selected: string | null;
  onSelect: (tag: string | null) => void;
  maxVisible?: number;
}

/**
 * Tag filter chips — inline, no wrapping (participates in parent horizontal scroll).
 */
export function TagFilter({ tags, selected, onSelect, maxVisible = 10 }: TagFilterProps) {
  if (tags.length === 0) return null;

  return (
    <>
      {tags.slice(0, maxVisible).map((tag) => (
        <Badge
          key={tag}
          variant={selected === tag ? 'default' : 'secondary'}
          className="border-border shrink-0 cursor-pointer rounded-md border px-2.5 py-3.25 select-none"
          onClick={() => onSelect(selected === tag ? null : tag)}
        >
          {tag}
        </Badge>
      ))}
      {tags.length > maxVisible && (
        <Badge variant="secondary" className="shrink-0 select-none">
          +{tags.length - maxVisible}
        </Badge>
      )}
    </>
  );
}
