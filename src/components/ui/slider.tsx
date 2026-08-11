'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Small } from '@/components/ui/typography';

interface SliderProps extends Omit<React.ComponentProps<'input'>, 'type' | 'onChange' | 'value'> {
  value: number;
  onValueChange: (value: number) => void;
  /** Optional label rendered above the slider */
  label?: React.ReactNode;
  /** Optional description rendered below the slider */
  description?: string;
}

/**
 * Shadcn-style range slider with optional label and description.
 * When label is provided, renders a complete labeled field.
 */
function Slider({
  className,
  id,
  value,
  onValueChange,
  label,
  description,
  ...props
}: SliderProps) {
  const slider = (
    <input
      type="range"
      id={id}
      data-slot="slider"
      value={value}
      onChange={(e) => onValueChange(Number(e.target.value))}
      className={cn('accent-primary w-full cursor-pointer', className)}
      {...props}
    />
  );

  if (!label && !description) return slider;

  return (
    <div className="space-y-1">
      {label && <Label htmlFor={id}>{label}</Label>}
      {slider}
      {description && <Small>{description}</Small>}
    </div>
  );
}

export { Slider };
