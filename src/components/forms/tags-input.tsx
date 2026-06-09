'use client';

import { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxTags?: number;
}

export interface TagsInputRef {
  /** Commits any pending text as a tag (call before form submit) */
  commitPending: () => void;
}

/**
 * Chip-style tags input.
 * - Enter/Tab to add a tag
 * - Backspace to delete last tag
 * - Click X to remove individual tag
 * - Auto-commits pending text on blur
 * - Exposes commitPending() for parent forms to call on submit
 */
export const TagsInput = forwardRef<TagsInputRef, TagsInputProps>(function TagsInput(
  { value, onChange, placeholder = 'Add tag...', disabled = false, maxTags = 20 },
  ref
) {
  const [input, setInput] = useState('');

  const addTag = useCallback(
    (raw: string) => {
      const tag = raw.trim();
      if (!tag) return;
      if (value.includes(tag)) return;
      if (value.length >= maxTags) return;
      onChange([...value, tag]);
      setInput('');
    },
    [value, onChange, maxTags]
  );

  const removeTag = useCallback(
    (tag: string) => {
      onChange(value.filter((t) => t !== tag));
    },
    [value, onChange]
  );

  // Expose commitPending to parent
  useImperativeHandle(ref, () => ({
    commitPending: () => addTag(input),
  }), [addTag, input]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === 'Tab') {
      if (input.trim()) {
        e.preventDefault();
        addTag(input);
      }
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  }

  function handleBlur() {
    // Auto-commit on blur so typed text isn't lost
    addTag(input);
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pl-2 pr-1 text-xs">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              disabled={disabled}
              className="ml-0.5 rounded-sm hover:bg-muted-foreground/20"
              aria-label={`Remove tag ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={disabled || value.length >= maxTags}
          className="flex-1 min-w-[80px] bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
          aria-label="Add tag"
        />
      </div>
      <p className="text-xs text-muted-foreground">Press Enter or Tab to add a tag</p>
    </div>
  );
});
