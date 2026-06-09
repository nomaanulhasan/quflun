'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Lock,
  Menu,
  KeyRound,
  ArrowLeftRight,
  Settings,
  HeartPulse,
  ShieldCheck,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useVaultStore } from '@/components/providers';

// ─── Navigation Items (grouped for hierarchy) ─────────────────────────────────

interface NavGroup {
  label?: string;
  items: { href: string; label: string; icon: typeof KeyRound }[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Vault',
    items: [
      { href: '/vault', label: 'Vault', icon: KeyRound },
    ],
  },
  {
    label: 'Tools',
    items: [
      { href: '/import-export', label: 'Import/Export', icon: ArrowLeftRight },
      { href: '/health-check', label: 'Health Check', icon: HeartPulse },
    ],
  },
  {
    label: 'Information',
    items: [
      { href: '/security', label: 'Security', icon: ShieldCheck },
      { href: '/privacy', label: 'Privacy', icon: FileText },
      { href: '/security-limitations', label: 'Limitations', icon: AlertTriangle },
    ],
  },
  {
    label: 'Settings',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

// ─── Shell Component ───────────────────────────────────────────────────────────

export function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const lock = useVaultStore((s) => s.lock);
  const status = useVaultStore((s) => s.status);

  return (
    <div className="flex h-full min-h-screen flex-col md:flex-row">
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border">
        <header className="flex h-14 items-center border-b border-border px-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Qufly
          </Link>
        </header>
        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Main navigation">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              {group.label && (
                <p className="px-3 pt-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                  {group.label}
                </p>
              )}
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
        {/* Lock button at bottom of sidebar */}
        {status === 'unlocked' && (
          <div className="border-t border-border p-3">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-accent-foreground"
              onClick={lock}
              aria-label="Lock vault"
            >
              <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
              Lock Vault
            </Button>
          </div>
        )}
      </aside>

      {/* Mobile header with sheet drawer */}
      <header className="flex h-14 items-center border-b border-border px-4 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="Open navigation menu" />
            }
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <SheetHeader>
              <SheetTitle className="text-lg font-semibold">Qufly</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 pt-4" aria-label="Main navigation">
              {navGroups.map((group) => (
                <div key={group.label} className="space-y-1">
                  {group.label && (
                    <p className="px-3 pt-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                      {group.label}
                    </p>
                  )}
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
              {/* Lock button in mobile nav */}
              {status === 'unlocked' && (
                <Button
                  variant="ghost"
                  className="mt-4 w-full justify-start gap-3 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-accent-foreground"
                  onClick={() => { lock(); setOpen(false); }}
                  aria-label="Lock vault"
                >
                  <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Lock Vault
                </Button>
              )}
            </nav>
          </SheetContent>
        </Sheet>
        <Link href="/" className="ml-3 text-lg font-semibold tracking-tight">
          Qufly
        </Link>
        {/* Lock button in mobile header */}
        {status === 'unlocked' && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            onClick={lock}
            aria-label="Lock vault"
          >
            <Lock className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </header>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
    </div>
  );
}
