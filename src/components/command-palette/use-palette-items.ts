'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, StickyNote, Lock, Plus, ArrowLeftRight, HeartPulse, Settings } from 'lucide-react';
import { useVaultStore, useUIStore } from '@/components/providers';
import { formatBinding } from '@/components/settings/shortcut-settings';
import type { PaletteItem } from './types';

/**
 * Builds the full list of palette items (actions + navigation + entries).
 * Only computes when `enabled` is true (palette open).
 */
export function usePaletteItems(enabled: boolean, onClose: () => void): PaletteItem[] {
  const router = useRouter();
  const entries = useVaultStore((s) => s.entries);
  const lock = useVaultStore((s) => s.lock);
  const status = useVaultStore((s) => s.status);
  const shortcuts = useUIStore((s) => s.settings.shortcuts);

  return useMemo(() => {
    if (!enabled) return [];

    const items: PaletteItem[] = [];

    // Actions (only when unlocked)
    if (status === 'unlocked') {
      items.push(
        { id: 'new-entry', label: 'New Password Entry', icon: Plus, shortcut: shortcuts?.newEntry ? formatBinding(shortcuts.newEntry) : 'Alt+N', action: () => { router.push('/vault/new'); onClose(); }, section: 'actions' },
        { id: 'new-note', label: 'New Secure Note', icon: StickyNote, shortcut: shortcuts?.newNote ? formatBinding(shortcuts.newNote) : 'Alt+Shift+N', action: () => { router.push('/vault/new?tab=note'); onClose(); }, section: 'actions' },
        { id: 'lock-vault', label: 'Lock Vault', icon: Lock, shortcut: shortcuts?.lockVault ? formatBinding(shortcuts.lockVault) : 'Ctrl+L', action: () => { lock(); onClose(); }, section: 'actions' },
      );
    }

    // Navigation
    items.push(
      { id: 'nav-import-export', label: 'Import/Export', icon: ArrowLeftRight, action: () => { router.push('/import-export'); onClose(); }, section: 'navigation' },
      { id: 'nav-password-health', label: 'Vault Health', icon: HeartPulse, action: () => { router.push('/password-health'); onClose(); }, section: 'navigation' },
      { id: 'nav-settings', label: 'Settings', icon: Settings, action: () => { router.push('/settings'); onClose(); }, section: 'navigation' },
    );

    // Entries
    for (const e of entries) {
      items.push({
        id: `entry-${e.uuid}`,
        label: e.title,
        subtitle: e.username || (e.type === 'note' ? 'Secure note' : undefined),
        icon: e.type === 'note' ? StickyNote : KeyRound,
        action: () => { router.push(`/vault?edit=${e.uuid}`); onClose(); },
        section: 'entries',
      });
    }

    return items;
  }, [enabled, status, entries, lock, router, onClose, shortcuts]);
}
