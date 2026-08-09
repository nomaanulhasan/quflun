'use client';

import { memo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { navGroups } from './nav-config';

interface MobileHeaderProps {
  isUnlocked: boolean;
  onLock: () => void;
}

/** Mobile top header with slide-out navigation drawer. */
export const MobileHeader = memo(function MobileHeader({ isUnlocked, onLock }: MobileHeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="flex h-14 items-center border-b border-border px-4 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open navigation menu" />}>
          <Menu className="h-5 w-5" aria-hidden="true" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64">
          <SheetHeader>
            <SheetTitle className="text-lg font-semibold">Quflun</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 pt-4" aria-label="Main navigation">
            {navGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                <p className="px-3 pt-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                  {group.label}
                </p>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
            {isUnlocked && (
              <Button
                variant="ghost"
                className="mt-4 w-full justify-start gap-3 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-accent-foreground"
                onClick={() => { onLock(); setOpen(false); }}
                aria-label="Lock vault"
              >
                <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
                Lock Vault
              </Button>
            )}
          </nav>
        </SheetContent>
      </Sheet>

      <Link href="/" className="ml-3 text-lg font-semibold tracking-tight">Quflun</Link>

      {isUnlocked && (
        <Button variant="ghost" size="icon" className="ml-auto" onClick={onLock} aria-label="Lock vault">
          <Lock className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}
    </header>
  );
});
