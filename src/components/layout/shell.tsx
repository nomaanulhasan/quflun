'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useVaultStore, useUIStore } from '@/components/providers';
import { useShellShortcuts } from './use-shell-shortcuts';
import { Sidebar } from './sidebar';
import { MobileHeader } from './mobile-header';
import { CommandPalette } from '@/components/command-palette/command-palette';

export function Shell({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const router = useRouter();
  const lock = useVaultStore((s) => s.lock);
  const status = useVaultStore((s) => s.status);
  const idleTimeoutMinutes = useUIStore((s) => s.settings.idleTimeoutMinutes);

  const isUnlocked = status === 'unlocked';

  // ─── Keyboard shortcuts ────────────────────────────────────────────────────
  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);
  useShellShortcuts(openPalette);

  // ─── Idle auto-lock ────────────────────────────────────────────────────────
  const lockRef = useRef(lock);
  lockRef.current = lock;

  useEffect(() => {
    if (!isUnlocked || idleTimeoutMinutes <= 0) return;

    const timeoutMs = idleTimeoutMinutes * 60 * 1000;
    let timer: ReturnType<typeof setTimeout>;

    function resetTimer() {
      clearTimeout(timer);
      timer = setTimeout(() => lockRef.current(), timeoutMs);
    }

    const events = ['pointermove', 'keydown', 'touchstart', 'scroll'] as const;
    events.forEach((e) => document.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => document.removeEventListener(e, resetTimer));
    };
  }, [isUnlocked, idleTimeoutMinutes]);

  // ─── Redirect to home when vault locks ─────────────────────────────────────
  useEffect(() => {
    if (status === 'locked') router.replace('/');
  }, [status, router]);

  return (
    <div className="flex h-screen flex-col overflow-hidden md:flex-row">
      <Sidebar isUnlocked={isUnlocked} onLock={lock} />
      <MobileHeader isUnlocked={isUnlocked} onLock={lock} onOpenPalette={openPalette} />
      <main className="flex-1 overflow-y-auto p-4 pr-0 md:p-6 md:pr-0">{children}</main>
      <CommandPalette open={paletteOpen} onClose={closePalette} />
    </div>
  );
}
