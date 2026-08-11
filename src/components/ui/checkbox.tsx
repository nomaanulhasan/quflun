'use client';

import * as React from 'react';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<React.ComponentProps<'input'>, 'type' | 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

function Checkbox({ className, checked, onCheckedChange, ...props }: CheckboxProps) {
  return (
    <label className={cn('relative inline-flex cursor-pointer items-center', className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className="peer sr-only"
        {...props}
      />
      <div className="border-input peer-focus-visible:ring-ring/50 peer-checked:border-primary peer-checked:bg-primary flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors peer-focus-visible:ring-3 peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
        {checked && <Check className="h-3 w-3 text-white" />}
      </div>
    </label>
  );
}

export { Checkbox };
