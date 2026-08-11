'use client';

import { memo, useState } from 'react';
import Link from 'next/link';
import { Lock, Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { NavLinks, LockButton } from './nav-links';

interface MobileHeaderProps {
  isUnlocked: boolean;
  onLock: () => void;
  onOpenPalette?: () => void;
}

/** Mobile top header with slide-out navigation drawer. */
export const MobileHeader = memo(function MobileHeader({
  isUnlocked,
  onLock,
  onOpenPalette,
}: MobileHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-border flex h-14 items-center border-b px-4 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" aria-label="Open navigation menu" />}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </SheetTrigger>
        <SheetContent side="left" className="flex h-full w-64 flex-col">
          <SheetHeader className="shrink-0">
            <SheetTitle className="text-lg font-semibold">Quflun</SheetTitle>
          </SheetHeader>

          <nav className="mask-fade-y min-h-0 flex-1 overflow-y-auto" aria-label="Main navigation">
            <NavLinks onNavigate={() => setOpen(false)} />
          </nav>

          {isUnlocked && (
            <div className="border-border shrink-0 border-t pt-3 pb-4">
              <LockButton
                onLock={() => {
                  onLock();
                  setOpen(false);
                }}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Link href="/" className="ml-3 text-lg font-semibold tracking-tight">
        Quflun
      </Link>

      <div className="ml-auto flex items-center gap-1">
        {isUnlocked && onOpenPalette && (
          <Button variant="ghost" size="icon" onClick={onOpenPalette} aria-label="Search entries">
            <Search className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
        {isUnlocked && (
          <Button variant="ghost" size="icon" onClick={onLock} aria-label="Lock vault">
            <Lock className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </header>
  );
});
