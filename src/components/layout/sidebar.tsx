'use client';

import { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { navGroups } from './nav-config';

interface SidebarProps {
  isUnlocked: boolean;
  onLock: () => void;
}

/** Desktop sidebar — renders nav groups and lock button. */
export const Sidebar = memo(function Sidebar({ isUnlocked, onLock }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border">
      <header className="flex h-14 items-center border-b border-border px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">Quflun</Link>
      </header>

      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Main navigation">
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
      </nav>

      {isUnlocked && (
        <div className="border-t border-border p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-accent-foreground"
            onClick={onLock}
            aria-label="Lock vault"
          >
            <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
            Lock Vault
          </Button>
        </div>
      )}
    </aside>
  );
});
