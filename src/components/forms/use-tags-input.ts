import { useState, useCallback, useMemo, useRef } from 'react';

interface UseTagsInputOptions {
  value: string[];
  onChange: (tags: string[]) => void;
  maxTags: number;
  maxTagLength: number;
  suggestions: string[];
}

/**
 * Encapsulates tags-input state and logic:
 * adding/removing tags, autocomplete filtering, keyboard navigation, blur handling.
 */
export function useTagsInput({
  value,
  onChange,
  maxTags,
  maxTagLength,
  suggestions,
}: UseTagsInputOptions) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  // Refs for stable callbacks that read current values without re-creating
  const inputRef = useRef(input);
  inputRef.current = input;
  const valueRef = useRef(value);
  valueRef.current = value;

  const filteredSuggestions = useMemo(() => {
    const query = input.trim().toLowerCase();
    if (!query) return [];
    return suggestions
      .filter((tag) => tag.toLowerCase().includes(query) && !value.includes(tag))
      .slice(0, 8);
  }, [input, suggestions, value]);

  // Clamp highlight when the list shrinks
  const highlightClamped =
    highlightIndex >= filteredSuggestions.length ? filteredSuggestions.length - 1 : highlightIndex;

  const addTag = useCallback(
    (raw: string) => {
      const tag = raw.trim().slice(0, maxTagLength);
      if (!tag || valueRef.current.includes(tag) || valueRef.current.length >= maxTags) return;
      onChange([...valueRef.current, tag]);
      setInput('');
      setShowSuggestions(false);
      setHighlightIndex(-1);
    },
    [onChange, maxTags, maxTagLength]
  );

  const removeTag = useCallback(
    (tag: string) => {
      onChange(valueRef.current.filter((t) => t !== tag));
    },
    [onChange]
  );

  const commitPending = useCallback(() => {
    addTag(inputRef.current);
  }, [addTag]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const hasSuggestions = filteredSuggestions.length > 0;

      switch (e.key) {
        case 'ArrowDown':
          if (!hasSuggestions) break;
          e.preventDefault();
          setShowSuggestions(true);
          setHighlightIndex((i) => Math.min(i + 1, filteredSuggestions.length - 1));
          break;
        case 'ArrowUp':
          if (!hasSuggestions) break;
          e.preventDefault();
          setHighlightIndex((i) => Math.max(i - 1, -1));
          break;
        case 'Enter':
        case 'Tab':
          if (highlightClamped >= 0 && filteredSuggestions[highlightClamped]) {
            e.preventDefault();
            addTag(filteredSuggestions[highlightClamped]);
          } else if (inputRef.current.trim()) {
            e.preventDefault();
            addTag(inputRef.current);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          setHighlightIndex(-1);
          break;
        case 'Backspace':
          if (!inputRef.current && valueRef.current.length > 0) {
            removeTag(valueRef.current[valueRef.current.length - 1]);
          }
          break;
      }
    },
    [filteredSuggestions, highlightClamped, addTag, removeTag]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.slice(0, maxTagLength);
      setInput(val);
      setShowSuggestions(val.trim().length > 0);
      setHighlightIndex(-1);
    },
    [maxTagLength]
  );

  const handleBlur = useCallback(() => {
    const pending = inputRef.current;
    setTimeout(() => {
      // Only commit if input hasn't changed (a suggestion click clears it first)
      if (inputRef.current === pending) addTag(pending);
      setShowSuggestions(false);
    }, 120);
  }, [addTag]);

  const handleFocus = useCallback(() => {
    if (inputRef.current.trim()) setShowSuggestions(true);
  }, []);

  return {
    input,
    filteredSuggestions,
    highlightIndex: highlightClamped,
    showSuggestions: showSuggestions && filteredSuggestions.length > 0,
    isFull: value.length >= maxTags,
    addTag,
    removeTag,
    commitPending,
    handleKeyDown,
    handleChange,
    handleBlur,
    handleFocus,
  };
}
