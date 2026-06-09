'use client';

import { FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CategoryFilterProps {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
}

/**
 * Category filter buttons with toggle selection.
 */
export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {categories.map((cat) => (
        <Button
          key={cat}
          variant={selected === cat ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelect(selected === cat ? null : cat)}
          className="gap-1.5"
        >
          <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
          {cat}
        </Button>
      ))}
    </div>
  );
}
