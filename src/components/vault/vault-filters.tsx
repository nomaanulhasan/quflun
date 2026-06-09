'use client';

import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TagFilter } from '@/components/filters/tag-filter';
import { CategoryFilter } from '@/components/filters/category-filter';

interface VaultFiltersProps {
  showFavorites: boolean;
  onToggleFavorites: () => void;
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
  tags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function VaultFilters({
  showFavorites, onToggleFavorites,
  categories, selectedCategory, onSelectCategory,
  tags, selectedTag, onSelectTag,
  hasActiveFilters, onClearFilters,
}: VaultFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={showFavorites ? 'default' : 'outline'}
        size="sm"
        onClick={onToggleFavorites}
        className="gap-1.5"
      >
        <Star className={`h-3.5 w-3.5 ${showFavorites ? 'fill-current' : ''}`} aria-hidden="true" />
        Favorites
      </Button>
      <CategoryFilter categories={categories} selected={selectedCategory} onSelect={onSelectCategory} />
      <TagFilter tags={tags} selected={selectedTag} onSelect={onSelectTag} />
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-xs">
          Clear filters
        </Button>
      )}
    </div>
  );
}
