'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useVaultStore, useUIStore } from '@/components/providers';
import { useHotkeys, type Shortcut } from '@/hooks/use-hotkeys';

/**
 * Wires up global keyboard shortcuts for the shell.
 * Uses the ref-based useHotkeys — listener registered once, always reads latest bindings.
 */
export function useShellShortcuts(openPalette: () => void) {
  const router = useRouter();
  const lock = useVaultStore((s) => s.lock);
  const status = useVaultStore((s) => s.status);
  const bindings = useUIStore((s) => s.settings.shortcuts);

  const shortcuts: Shortcut[] = useMemo(
    () => [
      {
        key: bindings?.commandPalette?.key ?? 'k',
        ctrl: bindings?.commandPalette?.ctrl,
        alt: bindings?.commandPalette?.alt,
        shift: bindings?.commandPalette?.shift,
        handler: openPalette,
        global: true,
      },
      {
        key: bindings?.newEntry?.key ?? 'n',
        ctrl: bindings?.newEntry?.ctrl,
        alt: bindings?.newEntry?.alt,
        shift: bindings?.newEntry?.shift,
        handler: () => {
          if (status === 'unlocked') router.push('/vault/new');
        },
        global: true,
      },
      {
        key: bindings?.newNote?.key ?? 'n',
        ctrl: bindings?.newNote?.ctrl,
        alt: bindings?.newNote?.alt,
        shift: bindings?.newNote?.shift,
        handler: () => {
          if (status === 'unlocked') router.push('/vault/new?tab=note');
        },
        global: true,
      },
      {
        key: bindings?.lockVault?.key ?? 'l',
        ctrl: bindings?.lockVault?.ctrl,
        alt: bindings?.lockVault?.alt,
        shift: bindings?.lockVault?.shift,
        handler: () => {
          if (status === 'unlocked') lock();
        },
        global: true,
      },
    ],
    [bindings, status, lock, router, openPalette]
  );

  useHotkeys(shortcuts);
}
