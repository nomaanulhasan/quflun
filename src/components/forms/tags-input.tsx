'use client';

import { forwardRef, useImperativeHandle } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTagsInput } from './use-tags-input';
import type { TagsInputProps, TagsInputRef } from './tags-input-types';

/**
 * Chip-style tags input with autocomplete.
 * Enter/Tab to add, Arrow keys to navigate suggestions, Backspace to remove last.
 */
export const TagsInput = forwardRef<TagsInputRef, TagsInputProps>(function TagsInput(
  {
    value,
    onChange,
    placeholder = 'Add tag...',
    disabled = false,
    maxTags = 20,
    maxTagLength = 64,
    suggestions = [],
  },
  ref
) {
  const {
    input,
    filteredSuggestions,
    highlightIndex,
    showSuggestions,
    isFull,
    addTag,
    removeTag,
    commitPending,
    handleKeyDown,
    handleChange,
    handleBlur,
    handleFocus,
  } = useTagsInput({ value, onChange, maxTags, maxTagLength, suggestions });

  useImperativeHandle(ref, () => ({ commitPending }), [commitPending]);

  return (
    <div className="space-y-1">
      <div className="relative">
        {/* Input field with tag chips */}
        <div className="border-input bg-background focus-within:ring-ring flex flex-wrap items-center gap-1.5 overflow-hidden rounded-md border px-2 py-1.5 focus-within:ring-2">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="max-w-full gap-1 pr-1 pl-2 text-xs">
              <span className="truncate">{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                disabled={disabled}
                className="hover:bg-muted-foreground/20 ml-0.5 shrink-0 cursor-pointer rounded-sm"
                aria-label={`Remove tag ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <input
            type="text"
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={value.length === 0 ? placeholder : ''}
            disabled={disabled || isFull}
            maxLength={maxTagLength}
            className="placeholder:text-muted-foreground min-w-20 flex-1 bg-transparent text-sm outline-none disabled:opacity-50"
            aria-label="Add tag"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
          />
        </div>

        {/* Autocomplete dropdown */}
        {showSuggestions && (
          <ul
            className="bg-popover border-border absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border py-1 shadow-md"
            role="listbox"
            aria-label="Tag suggestions"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <li
                key={suggestion}
                role="option"
                aria-selected={index === highlightIndex}
                className={`cursor-pointer px-3 py-1.5 text-sm ${
                  index === highlightIndex
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(suggestion);
                }}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-muted-foreground text-xs">Press Enter or Tab to add a tag</p>
    </div>
  );
});
