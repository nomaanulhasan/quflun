'use client';

import { useState, useCallback, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TagFilter } from '@/components/filters/tag-filter';
import { CategoryFilter } from '@/components/filters/category-filter';
import { useHorizontalScroll } from '@/hooks/use-horizontal-scroll';

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
  showFavorites,
  onToggleFavorites,
  categories,
  selectedCategory,
  onSelectCategory,
  tags,
  selectedTag,
  onSelectTag,
  hasActiveFilters,
  onClearFilters,
}: VaultFiltersProps) {
  const { ref, onPointerDown, onPointerMove, onPointerUp } = useHorizontalScroll<HTMLDivElement>();
  const [fadeLeft, setFadeLeft] = useState(false);
  const [fadeRight, setFadeRight] = useState(false);

  const updateFade = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setFadeLeft(el.scrollLeft > 2);
    setFadeRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, [ref]);

  // Measure on mount + when content changes
  useEffect(() => {
    requestAnimationFrame(updateFade);
  }, [updateFade, categories.length, tags.length, hasActiveFilters]);

  const fadeClass =
    fadeLeft && fadeRight
      ? 'mask-fade-x'
      : fadeLeft
        ? 'mask-fade-left'
        : fadeRight
          ? 'mask-fade-right'
          : '';

  return (
    <div
      ref={ref}
      onScroll={updateFade}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={`-mb-1 flex scrollbar-none items-center gap-2 overflow-x-auto pb-1 ${fadeClass}`}
    >
      <Button
        variant={showFavorites ? 'default' : 'outline'}
        size="sm"
        onClick={onToggleFavorites}
        className="shrink-0 gap-1.5"
      >
        <Star className={`h-3.5 w-3.5 ${showFavorites ? 'fill-current' : ''}`} aria-hidden="true" />
        Favorites
      </Button>
      <CategoryFilter
        categories={categories}
        selected={selectedCategory}
        onSelect={onSelectCategory}
      />
      <TagFilter tags={tags} selected={selectedTag} onSelect={onSelectTag} />
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="shrink-0 gap-1 text-xs"
        >
          <X className="h-3 w-3" aria-hidden="true" />
          Clear
        </Button>
      )}
    </div>
  );
}
