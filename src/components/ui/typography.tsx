import * as React from 'react';

import { cn } from '@/lib/utils';

// ─── Headings ──────────────────────────────────────────────────────────────────

function H1({ className, ...props }: React.ComponentProps<'h1'>) {
  return <h1 className={cn('text-xl font-semibold tracking-tight', className)} {...props} />;
}

function H2({ className, ...props }: React.ComponentProps<'h2'>) {
  return <h2 className={cn('text-lg font-semibold tracking-tight', className)} {...props} />;
}

function H3({ className, ...props }: React.ComponentProps<'h3'>) {
  return <h3 className={cn('text-base font-semibold', className)} {...props} />;
}

// ─── Text ──────────────────────────────────────────────────────────────────────

function Text({ className, ...props }: React.ComponentProps<'p'>) {
  return <p className={cn('text-sm', className)} {...props} />;
}

function Muted({ className, ...props }: React.ComponentProps<'p'>) {
  return <p className={cn('text-muted-foreground text-sm', className)} {...props} />;
}

function Small({ className, ...props }: React.ComponentProps<'p'>) {
  return <p className={cn('text-muted-foreground text-xs', className)} {...props} />;
}

// ─── Inline ────────────────────────────────────────────────────────────────────

function Span({ className, ...props }: React.ComponentProps<'span'>) {
  return <span className={cn('text-sm', className)} {...props} />;
}

export { H1, H2, H3, Text, Muted, Small, Span };
