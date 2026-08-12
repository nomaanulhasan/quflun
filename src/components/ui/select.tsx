import * as React from 'react';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Small } from '@/components/ui/typography';

interface SelectProps extends React.ComponentProps<'select'> {
  /** Optional label rendered above the select */
  label?: string;
  /** Optional description rendered below the select */
  description?: string;
}

/**
 * Shadcn-style select with optional label and description.
 * When label is provided, renders a complete labeled field.
 */
function Select({ className, id, label, description, children, ...props }: SelectProps) {
  const select = (
    <select
      id={id}
      data-slot="select"
      className={cn(
        'border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 disabled:bg-input/50 h-8 w-full min-w-0 appearance-none rounded-lg border px-2.5 py-1 text-base transition-colors outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );

  if (!label && !description) return select;

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      {select}
      {description && <Small>{description}</Small>}
    </div>
  );
}

export { Select };
