'use client';

import { useEffect, useRef } from 'react';

/**
 * Shortcut definition for a keyboard shortcut.
 */
export interface Shortcut {
  /** The key to listen for (e.g., 'k', 'n', 'l') */
  key: string;
  /** Whether Ctrl (or Cmd on macOS) is required */
  ctrl?: boolean;
  /** Whether Shift is required */
  shift?: boolean;
  /** Whether Alt is required */
  alt?: boolean;
  /** Handler called when the shortcut fires */
  handler: (e: KeyboardEvent) => void;
  /** If true, shortcut is active even when an input/textarea is focused */
  global?: boolean;
}

/**
 * useHotkeys — registers global keyboard shortcuts.
 *
 * Uses a ref to always access the latest shortcuts without re-registering
 * the event listener. The listener is registered once on mount.
 */
export function useHotkeys(shortcuts: Shortcut[]) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      for (const shortcut of shortcutsRef.current) {
        if (isInput && !shortcut.global) continue;

        const ctrlMatch = shortcut.ctrl
          ? e.ctrlKey || e.metaKey
          : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;

        if (
          e.key.toLowerCase() === shortcut.key.toLowerCase() &&
          ctrlMatch &&
          shiftMatch &&
          altMatch
        ) {
          e.preventDefault();
          e.stopPropagation();
          shortcut.handler(e);
          return;
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, []); // Registered once — ref keeps shortcuts fresh
}
