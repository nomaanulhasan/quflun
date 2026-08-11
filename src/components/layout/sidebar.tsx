'use client';

import { memo } from 'react';
import Link from 'next/link';
import { NavLinks, LockButton } from './nav-links';
import { ScrollFade } from '@/components/common/scroll-fade';

interface SidebarProps {
  isUnlocked: boolean;
  onLock: () => void;
}

/** Desktop sidebar — logo pinned top, lock pinned bottom, nav scrolls between. */
export const Sidebar = memo(function Sidebar({ isUnlocked, onLock }: SidebarProps) {
  return (
    <aside className="md:border-border hidden h-screen overflow-x-hidden md:flex md:w-64 md:flex-col md:border-r">
      <header className="border-border flex h-14 shrink-0 items-center border-b px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Quflun
        </Link>
      </header>

      <ScrollFade direction="vertical" className="min-h-0 flex-1 overflow-y-auto p-3">
        <nav aria-label="Main navigation">
          <NavLinks />
        </nav>
      </ScrollFade>

      {isUnlocked && (
        <div className="border-border shrink-0 border-t p-3">
          <LockButton onLock={onLock} />
        </div>
      )}
    </aside>
  );
});
