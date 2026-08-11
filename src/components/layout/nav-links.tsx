'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { navGroups } from './nav-config';

interface NavLinksProps {
  onNavigate?: () => void;
}

/** Shared nav group list — used by both desktop sidebar and mobile drawer. */
export function NavLinks({ onNavigate }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-1">
      {navGroups.map((group, idx) => (
        <div key={group.label} className="space-y-1">
          <p className="text-muted-foreground/60 px-3 pt-3 pb-1 text-xs font-medium tracking-wider uppercase">
            {group.label}
          </p>
          {group.items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
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
          {idx < navGroups.length - 1 && <div className="my-1" />}
        </div>
      ))}
    </div>
  );
}

interface LockButtonProps {
  onLock: () => void;
}

/** Shared lock vault button. */
export function LockButton({ onLock }: LockButtonProps) {
  return (
    <Button
      variant="ghost"
      className="text-muted-foreground hover:text-accent-foreground w-full justify-start gap-3 px-3 py-3 text-sm font-medium"
      onClick={onLock}
      aria-label="Lock vault"
    >
      <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
      Lock Vault
    </Button>
  );
}
