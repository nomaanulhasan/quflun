'use client';

import { Star } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface FavoriteToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

/**
 * Favorite checkbox toggle with star icon.
 */
export function FavoriteToggle({ checked, onChange, disabled = false }: FavoriteToggleProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <Checkbox
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className="hidden"
      />
      <Star
        className={`h-4 w-4 ${checked ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`}
        aria-hidden="true"
      />
      Mark as favorite
    </label>
  );
}
