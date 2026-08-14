/**
 * Tests for defaultCategory prop on forms (v1.9.1)
 * - EntryForm, NoteForm, and PinForm accept defaultCategory prop
 * - Category state is initialized from defaultCategory when no entry is provided
 * - Category state falls back to entry.category when editing
 * - Category state defaults to '' when neither entry nor defaultCategory is provided
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ─── Mocks ─────────────────────────────────────────────────────────────────────

const mockAddEntry = vi.fn().mockResolvedValue('entry-1');
const mockEditEntry = vi.fn().mockResolvedValue(undefined);
const mockAddNote = vi.fn().mockResolvedValue('note-1');
const mockEditNote = vi.fn().mockResolvedValue(undefined);
const mockAddPin = vi.fn().mockResolvedValue('pin-1');
const mockEditPin = vi.fn().mockResolvedValue(undefined);
const mockSetCategory = vi.fn().mockResolvedValue(undefined);

vi.mock('@/components/providers', () => ({
  useVaultStore: vi.fn((selector: (state: unknown) => unknown) => {
    const state = {
      status: 'unlocked',
      entries: [],
      addEntry: mockAddEntry,
      editEntry: mockEditEntry,
      addNote: mockAddNote,
      editNote: mockEditNote,
      addPin: mockAddPin,
      editPin: mockEditPin,
      setCategory: mockSetCategory,
      categories: ['Work', 'Personal'],
    };
    return selector(state);
  }),
  useUIStore: vi.fn((selector?: (state: unknown) => unknown) => {
    const state = { settings: { clipboardTimeoutSeconds: 30 } };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@/hooks/use-copy-action', () => ({
  useCopyAction: () => ({ copy: vi.fn(), isCopied: vi.fn().mockReturnValue(false) }),
}));

vi.mock('@/lib/runtime', () => ({
  getServices: vi.fn().mockResolvedValue({
    engine: { getCategories: () => ['Work', 'Personal'] },
  }),
}));

// lucide-react is not mocked — icons render as real SVGs in happy-dom

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/vault/new',
  useSearchParams: () => new URLSearchParams(),
}));

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('defaultCategory prop', { timeout: 30_000 }, () => {
  describe('EntryForm', () => {
    it('initializes category from defaultCategory when creating new entry', async () => {
      const { EntryForm } = await import('@/components/vault/entry-form');
      render(<EntryForm onSuccess={vi.fn()} onBack={vi.fn()} defaultCategory="Work" />);

      // CategorySelect renders a select with the value prop set to the category
      // The select should have "Work" selected
      const select = await screen.findByLabelText('Category');
      expect((select as HTMLSelectElement).value).toBe('Work');
    });

    it('defaults category to empty string when no defaultCategory is provided', async () => {
      const { EntryForm } = await import('@/components/vault/entry-form');
      render(<EntryForm onSuccess={vi.fn()} onBack={vi.fn()} />);

      const select = await screen.findByLabelText('Category');
      expect((select as HTMLSelectElement).value).toBe('');
    });

    it('uses entry category over defaultCategory when editing', async () => {
      const { EntryForm } = await import('@/components/vault/entry-form');
      const existingEntry = {
        uuid: 'entry-1',
        type: 'password' as const,
        title: 'Test',
        username: 'user',
        password: 'pass123',
        url: '',
        notes: '',
        tags: [],
        favorite: false,
        category: 'Personal',
        customFields: [],
        attachments: [],
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      };
      render(
        <EntryForm
          entry={existingEntry}
          onSuccess={vi.fn()}
          onBack={vi.fn()}
          defaultCategory="Work"
        />
      );

      const select = await screen.findByLabelText('Category');
      // entry.category takes priority over defaultCategory
      expect((select as HTMLSelectElement).value).toBe('Personal');
    });
  });

  describe('NoteForm', () => {
    it('initializes category from defaultCategory when creating new note', async () => {
      const { NoteForm } = await import('@/components/vault/note-form');
      render(<NoteForm onSuccess={vi.fn()} onBack={vi.fn()} defaultCategory="Personal" />);

      const select = await screen.findByLabelText('Category');
      expect((select as HTMLSelectElement).value).toBe('Personal');
    });

    it('defaults category to empty string when no defaultCategory', async () => {
      const { NoteForm } = await import('@/components/vault/note-form');
      render(<NoteForm onSuccess={vi.fn()} onBack={vi.fn()} />);

      const select = await screen.findByLabelText('Category');
      expect((select as HTMLSelectElement).value).toBe('');
    });
  });

  describe('PinForm', () => {
    it('initializes category from defaultCategory when creating new PIN', async () => {
      const { PinForm } = await import('@/components/vault/pin-form');
      render(<PinForm onSuccess={vi.fn()} onBack={vi.fn()} defaultCategory="Work" />);

      const select = await screen.findByLabelText('Category');
      expect((select as HTMLSelectElement).value).toBe('Work');
    });

    it('defaults category to empty string when no defaultCategory', async () => {
      const { PinForm } = await import('@/components/vault/pin-form');
      render(<PinForm onSuccess={vi.fn()} onBack={vi.fn()} />);

      const select = await screen.findByLabelText('Category');
      expect((select as HTMLSelectElement).value).toBe('');
    });
  });

  describe('NewEntryPage routing', () => {
    it('passes null defaultCategory when no folder param in URL', async () => {
      // The mock useSearchParams returns empty URLSearchParams,
      // so folderParam will be null, which is passed as defaultCategory
      const { EntryForm } = await import('@/components/vault/entry-form');
      render(<EntryForm onSuccess={vi.fn()} onBack={vi.fn()} defaultCategory={null} />);

      const select = await screen.findByLabelText('Category');
      // null defaultCategory should default to ''
      expect((select as HTMLSelectElement).value).toBe('');
    });

    it('passes folder value as defaultCategory when present in URL', async () => {
      // Simulates what NewEntryPage does: reads ?folder=Work and passes it
      const { EntryForm } = await import('@/components/vault/entry-form');
      const folderParam = 'Work'; // simulating searchParams.get('folder')
      render(<EntryForm onSuccess={vi.fn()} onBack={vi.fn()} defaultCategory={folderParam} />);

      const select = await screen.findByLabelText('Category');
      expect((select as HTMLSelectElement).value).toBe('Work');
    });
  });
});
