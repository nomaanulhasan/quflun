'use client';

import { Badge } from '@/components/ui/badge';

interface TagFilterProps {
  tags: string[];
  selected: string | null;
  onSelect: (tag: string | null) => void;
  maxVisible?: number;
}

/**
 * Tag filter chips with toggle selection.
 */
export function TagFilter({ tags, selected, onSelect, maxVisible = 10 }: TagFilterProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {tags.slice(0, maxVisible).map((tag) => (
        <Badge
          key={tag}
          variant={selected === tag ? 'default' : 'secondary'}
          className="cursor-pointer"
          onClick={() => onSelect(selected === tag ? null : tag)}
        >
          {tag}
        </Badge>
      ))}
      {tags.length > maxVisible && (
        <Badge variant="secondary">+{tags.length - maxVisible}</Badge>
      )}
    </div>
  );
}
