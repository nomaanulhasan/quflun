/**
 * Tests for TagsInput component and useTagsInput hook (v1.9.0)
 * - Tag autocomplete suggestions from existing vault tags
 * - Arrow key navigation in tag suggestions dropdown
 * - Filtering logic, selection via Enter, dismiss via Escape
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// ─── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('lucide-react', () => ({
  X: (props: Record<string, unknown>) => <svg data-testid="x-icon" {...props} />,
}));

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('TagsInput', () => {
  async function renderTagsInput(props: {
    value?: string[];
    onChange?: (tags: string[]) => void;
    suggestions?: string[];
    disabled?: boolean;
    maxTags?: number;
  }) {
    const { TagsInput } = await import('@/components/forms/tags-input');
    const defaultProps = {
      value: props.value ?? [],
      onChange: props.onChange ?? vi.fn(),
      suggestions: props.suggestions ?? [],
      disabled: props.disabled ?? false,
      maxTags: props.maxTags ?? 20,
    };
    return render(<TagsInput {...defaultProps} />);
  }

  function getInput() {
    return screen.getByLabelText('Add tag') as HTMLInputElement;
  }

  describe('Basic tag operations', () => {
    it('renders existing tags as badges', async () => {
      await renderTagsInput({ value: ['react', 'typescript'] });

      expect(screen.getByText('react')).toBeDefined();
      expect(screen.getByText('typescript')).toBeDefined();
    });

    it('adds a tag on Enter', async () => {
      const onChange = vi.fn();
      await renderTagsInput({ value: [], onChange });

      const input = getInput();
      fireEvent.change(input, { target: { value: 'newtag' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).toHaveBeenCalledWith(['newtag']);
    });

    it('adds a tag on Tab', async () => {
      const onChange = vi.fn();
      await renderTagsInput({ value: [], onChange });

      const input = getInput();
      fireEvent.change(input, { target: { value: 'tabbed' } });
      fireEvent.keyDown(input, { key: 'Tab' });

      expect(onChange).toHaveBeenCalledWith(['tabbed']);
    });

    it('removes a tag when clicking the remove button', async () => {
      const onChange = vi.fn();
      await renderTagsInput({ value: ['remove-me', 'keep'], onChange });

      const removeBtn = screen.getByLabelText('Remove tag remove-me');
      fireEvent.click(removeBtn);

      expect(onChange).toHaveBeenCalledWith(['keep']);
    });

    it('removes last tag on Backspace when input is empty', async () => {
      const onChange = vi.fn();
      await renderTagsInput({ value: ['first', 'last'], onChange });

      const input = getInput();
      fireEvent.keyDown(input, { key: 'Backspace' });

      expect(onChange).toHaveBeenCalledWith(['first']);
    });

    it('does not add duplicate tags', async () => {
      const onChange = vi.fn();
      await renderTagsInput({ value: ['exists'], onChange });

      const input = getInput();
      fireEvent.change(input, { target: { value: 'exists' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not add tags beyond maxTags limit', async () => {
      const onChange = vi.fn();
      await renderTagsInput({ value: ['a', 'b', 'c'], onChange, maxTags: 3 });

      const input = getInput();
      expect(input.disabled).toBe(true);
    });
  });

  describe('Autocomplete suggestions', () => {
    it('shows filtered suggestions when typing matches available tags', async () => {
      await renderTagsInput({
        value: [],
        suggestions: ['react', 'redux', 'angular', 'vue'],
      });

      const input = getInput();
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'rea' } });

      expect(screen.getByRole('listbox')).toBeDefined();
      expect(screen.getByText('react')).toBeDefined();
      // 'redux' should not match 'rea'
      expect(screen.queryByText('angular')).toBeNull();
    });

    it('does not show suggestions already in value', async () => {
      await renderTagsInput({
        value: ['react'],
        suggestions: ['react', 'redux'],
      });

      const input = getInput();
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'r' } });

      // 'react' is already selected, should not appear
      const options = screen.getAllByRole('option');
      const texts = options.map((o) => o.textContent);
      expect(texts).not.toContain('react');
      expect(texts).toContain('redux');
    });

    it('hides suggestions when input is cleared', async () => {
      await renderTagsInput({
        value: [],
        suggestions: ['react', 'redux'],
      });

      const input = getInput();
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'r' } });
      expect(screen.getByRole('listbox')).toBeDefined();

      fireEvent.change(input, { target: { value: '' } });
      expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('hides suggestions on Escape', async () => {
      await renderTagsInput({
        value: [],
        suggestions: ['react', 'redux'],
      });

      const input = getInput();
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'r' } });
      expect(screen.getByRole('listbox')).toBeDefined();

      fireEvent.keyDown(input, { key: 'Escape' });
      expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('selects a suggestion on mousedown', async () => {
      const onChange = vi.fn();
      await renderTagsInput({
        value: [],
        onChange,
        suggestions: ['react', 'redux'],
      });

      const input = getInput();
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'r' } });

      const option = screen.getByText('redux');
      fireEvent.mouseDown(option);

      expect(onChange).toHaveBeenCalledWith(['redux']);
    });
  });

  describe('Arrow key navigation', () => {
    it('highlights next suggestion on ArrowDown', async () => {
      await renderTagsInput({
        value: [],
        suggestions: ['react', 'redux', 'relay'],
      });

      const input = getInput();
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'r' } });

      fireEvent.keyDown(input, { key: 'ArrowDown' });

      const options = screen.getAllByRole('option');
      expect(options[0].getAttribute('aria-selected')).toBe('true');
    });

    it('navigates down then up correctly', async () => {
      await renderTagsInput({
        value: [],
        suggestions: ['react', 'redux', 'relay'],
      });

      const input = getInput();
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'r' } });

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      const options = screen.getAllByRole('option');
      expect(options[1].getAttribute('aria-selected')).toBe('true');

      fireEvent.keyDown(input, { key: 'ArrowUp' });
      expect(options[0].getAttribute('aria-selected')).toBe('true');
    });

    it('does not navigate past the last suggestion', async () => {
      await renderTagsInput({
        value: [],
        suggestions: ['zoo', 'zenith'],
      });

      const input = getInput();
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'zoo' } });

      // Only 'zoo' matches exactly — navigate down multiple times
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      const options = screen.getAllByRole('option');
      // Should stay at last item (index 0 since only 'zoo' matches)
      expect(options[0].getAttribute('aria-selected')).toBe('true');
    });

    it('selects highlighted suggestion on Enter', async () => {
      const onChange = vi.fn();
      await renderTagsInput({
        value: [],
        onChange,
        suggestions: ['react', 'redux', 'relay'],
      });

      const input = getInput();
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'r' } });

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).toHaveBeenCalledWith(['redux']);
    });
  });
});
