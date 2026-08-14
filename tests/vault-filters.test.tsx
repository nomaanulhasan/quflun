/**
 * Tests for VaultFilters component (v1.9.0)
 * - Visual separators between Favorites, Folders, and Tags sections
 * - Category and tag filter rendering
 * - Clear filters behavior
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// ─── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('lucide-react', () => ({
  Star: (props: Record<string, unknown>) => <svg data-testid="star-icon" {...props} />,
  X: (props: Record<string, unknown>) => <svg data-testid="x-icon" {...props} />,
  FolderOpen: (props: Record<string, unknown>) => <svg data-testid="folder-icon" {...props} />,
}));

vi.mock('@/hooks/use-horizontal-scroll', () => ({
  useHorizontalScroll: () => ({
    ref: { current: null },
    onPointerDown: vi.fn(),
    onPointerMove: vi.fn(),
    onPointerUp: vi.fn(),
  }),
}));

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('VaultFilters', () => {
  async function renderFilters(
    props?: Partial<{
      showFavorites: boolean;
      categories: string[];
      selectedCategory: string | null;
      tags: string[];
      selectedTag: string | null;
      hasActiveFilters: boolean;
    }>
  ) {
    const { VaultFilters } = await import('@/components/vault/vault-filters');
    const defaultProps = {
      showFavorites: props?.showFavorites ?? false,
      onToggleFavorites: vi.fn(),
      categories: props?.categories ?? [],
      selectedCategory: props?.selectedCategory ?? null,
      onSelectCategory: vi.fn(),
      tags: props?.tags ?? [],
      selectedTag: props?.selectedTag ?? null,
      onSelectTag: vi.fn(),
      hasActiveFilters: props?.hasActiveFilters ?? false,
      onClearFilters: vi.fn(),
    };
    return render(<VaultFilters {...defaultProps} />);
  }

  describe('Separators', () => {
    it('renders a separator between Favorites and Categories when categories exist', async () => {
      const { container } = await renderFilters({
        categories: ['Work', 'Personal'],
      });

      // FilterSeparator renders a div with aria-hidden="true" and specific classes
      const separators = container.querySelectorAll('[aria-hidden="true"]');
      // Star icon also has aria-hidden, so filter by element type
      const divSeparators = Array.from(separators).filter(
        (el) => el.tagName === 'DIV' && el.classList.contains('w-px')
      );
      expect(divSeparators.length).toBeGreaterThanOrEqual(1);
    });

    it('renders a separator between Categories and Tags when both exist', async () => {
      const { container } = await renderFilters({
        categories: ['Work'],
        tags: ['important'],
      });

      const divSeparators = Array.from(
        container.querySelectorAll('div[aria-hidden="true"]')
      ).filter((el) => el.classList.contains('w-px'));
      // Should have 2 separators: one after favorites, one after categories
      expect(divSeparators.length).toBe(2);
    });

    it('renders no separators when neither categories nor tags exist', async () => {
      const { container } = await renderFilters({
        categories: [],
        tags: [],
      });

      const divSeparators = Array.from(
        container.querySelectorAll('div[aria-hidden="true"]')
      ).filter((el) => el.classList.contains('w-px'));
      expect(divSeparators.length).toBe(0);
    });

    it('renders one separator when only tags exist (no categories)', async () => {
      const { container } = await renderFilters({
        categories: [],
        tags: ['urgent'],
      });

      const divSeparators = Array.from(
        container.querySelectorAll('div[aria-hidden="true"]')
      ).filter((el) => el.classList.contains('w-px'));
      expect(divSeparators.length).toBe(1);
    });
  });

  describe('Rendering', () => {
    it('renders the Favorites button', async () => {
      await renderFilters();
      expect(screen.getByText('Favorites')).toBeDefined();
    });

    it('renders category buttons', async () => {
      await renderFilters({ categories: ['Work', 'Personal'] });
      expect(screen.getByText('Work')).toBeDefined();
      expect(screen.getByText('Personal')).toBeDefined();
    });

    it('renders tag filter chips', async () => {
      await renderFilters({ tags: ['urgent', 'important'] });
      expect(screen.getByText('urgent')).toBeDefined();
      expect(screen.getByText('important')).toBeDefined();
    });

    it('renders Clear button when filters are active', async () => {
      await renderFilters({ hasActiveFilters: true });
      expect(screen.getByText('Clear')).toBeDefined();
    });

    it('does not render Clear button when no filters are active', async () => {
      await renderFilters({ hasActiveFilters: false });
      expect(screen.queryByText('Clear')).toBeNull();
    });
  });

  describe('Interactions', () => {
    it('calls onToggleFavorites when Favorites button is clicked', async () => {
      const onToggleFavorites = vi.fn();
      const { VaultFilters } = await import('@/components/vault/vault-filters');
      render(
        <VaultFilters
          showFavorites={false}
          onToggleFavorites={onToggleFavorites}
          categories={[]}
          selectedCategory={null}
          onSelectCategory={vi.fn()}
          tags={[]}
          selectedTag={null}
          onSelectTag={vi.fn()}
          hasActiveFilters={false}
          onClearFilters={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('Favorites'));
      expect(onToggleFavorites).toHaveBeenCalledOnce();
    });

    it('calls onClearFilters when Clear button is clicked', async () => {
      const onClearFilters = vi.fn();
      const { VaultFilters } = await import('@/components/vault/vault-filters');
      render(
        <VaultFilters
          showFavorites={false}
          onToggleFavorites={vi.fn()}
          categories={[]}
          selectedCategory={null}
          onSelectCategory={vi.fn()}
          tags={[]}
          selectedTag={null}
          onSelectTag={vi.fn()}
          hasActiveFilters={true}
          onClearFilters={onClearFilters}
        />
      );

      fireEvent.click(screen.getByText('Clear'));
      expect(onClearFilters).toHaveBeenCalledOnce();
    });
  });
});
