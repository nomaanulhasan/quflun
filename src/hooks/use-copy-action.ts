'use client';

import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useUIStore } from '@/components/providers';
import { createClipboardManager, type ClipboardManager } from '@/lib/clipboard';

/**
 * Module-level singleton ClipboardManager.
 * Survives re-renders and component remounts — same as VaultEngine pattern.
 */
let sharedManager: ClipboardManager | null = null;

function getManager(): ClipboardManager {
  if (!sharedManager) {
    sharedManager = createClipboardManager();
  }
  return sharedManager;
}

/**
 * useCopyAction — provides a copy function with toast feedback and visual state.
 *
 * Uses the shared ClipboardManager singleton.
 * Respects the user's clipboard timeout from Settings.
 * Shows a toast with the timeout duration.
 * Returns `copied` state for icon feedback (true for ~2 seconds after copy).
 */
export function useCopyAction() {
  const clipboardTimeoutSeconds = useUIStore((s) => s.settings.clipboardTimeoutSeconds);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    async (value: string, label: string, fieldKey: string) => {
      const manager = getManager();
      const timeoutMs = clipboardTimeoutSeconds * 1000;

      await manager.copy(value, timeoutMs);
      toast.success(`${label} copied. Clipboard clears in ${clipboardTimeoutSeconds} seconds.`);

      // Visual feedback: show check icon for 2s
      setCopiedField(fieldKey);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => setCopiedField(null), 2000);
    },
    [clipboardTimeoutSeconds]
  );

  const isCopied = useCallback((fieldKey: string) => copiedField === fieldKey, [copiedField]);

  return { copy, isCopied };
}
