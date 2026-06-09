'use client';

import { useCallback, useRef } from 'react';
import type { ClipboardManager } from '@/lib/clipboard';

/**
 * useClipboard — wraps ClipboardManager with a simple copy action.
 *
 * Does not duplicate clipboard logic.
 * ClipboardManager handles timer management and ownership verification.
 *
 * Toast integration is deferred to the UI layer (the consumer can
 * show a toast after calling copy() successfully).
 *
 * @param manager - The ClipboardManager instance
 * @param timeoutMs - Clipboard clear timeout in milliseconds
 */
export function useClipboard(manager: ClipboardManager, timeoutMs?: number) {
  const managerRef = useRef(manager);
  managerRef.current = manager;

  const copy = useCallback(
    async (value: string): Promise<void> => {
      await managerRef.current.copy(value, timeoutMs);
    },
    [timeoutMs]
  );

  const clear = useCallback(async (): Promise<void> => {
    await managerRef.current.clearIfOwned();
  }, []);

  return {
    copy,
    clear,
  };
}
