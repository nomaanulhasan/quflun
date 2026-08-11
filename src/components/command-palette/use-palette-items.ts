'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  StickyNote,
  Lock,
  Plus,
  ArrowLeftRight,
  HeartPulse,
  Settings,
  KeyRound,
} from 'lucide-react';
import { useVaultStore, useUIStore } from '@/components/providers';
import { formatBinding } from '@/components/settings/shortcut-settings';
import type { PaletteItem } from './types';

/**
 * Builds the palette items (actions + navigation only).
 * Entries are NOT included — users search entries via the vault page search bar.
 * Only computes when `enabled` is true (palette open).
 */
export function usePaletteItems(enabled: boolean, onClose: () => void): PaletteItem[] {
  const router = useRouter();
  const lock = useVaultStore((s) => s.lock);
  const status = useVaultStore((s) => s.status);
  const shortcuts = useUIStore((s) => s.settings.shortcuts);

  return useMemo(() => {
    if (!enabled) return [];

    const items: PaletteItem[] = [];

    if (status === 'unlocked') {
      items.push(
        {
          id: 'new-entry',
          label: 'New Password Entry',
          icon: Plus,
          shortcut: shortcuts?.newEntry ? formatBinding(shortcuts.newEntry) : 'Alt+N',
          action: () => {
            router.push('/vault/new');
            onClose();
          },
          section: 'actions',
        },
        {
          id: 'new-note',
          label: 'New Secure Note',
          icon: StickyNote,
          shortcut: shortcuts?.newNote ? formatBinding(shortcuts.newNote) : 'Alt+Shift+N',
          action: () => {
            router.push('/vault/new?tab=note');
            onClose();
          },
          section: 'actions',
        },
        {
          id: 'lock-vault',
          label: 'Lock Vault',
          icon: Lock,
          shortcut: shortcuts?.lockVault ? formatBinding(shortcuts.lockVault) : 'Ctrl+L',
          action: () => {
            lock();
            onClose();
          },
          section: 'actions',
        },
        {
          id: 'nav-vault',
          label: 'Go to Vault',
          icon: KeyRound,
          action: () => {
            router.push('/vault');
            onClose();
          },
          section: 'navigation',
        }
      );
    }

    items.push(
      {
        id: 'nav-import-export',
        label: 'Import/Export',
        icon: ArrowLeftRight,
        action: () => {
          router.push('/import-export');
          onClose();
        },
        section: 'navigation',
      },
      {
        id: 'nav-password-health',
        label: 'Vault Health',
        icon: HeartPulse,
        action: () => {
          router.push('/password-health');
          onClose();
        },
        section: 'navigation',
      },
      {
        id: 'nav-settings',
        label: 'Settings',
        icon: Settings,
        action: () => {
          router.push('/settings');
          onClose();
        },
        section: 'navigation',
      }
    );

    return items;
  }, [enabled, status, lock, router, onClose, shortcuts]);
}
