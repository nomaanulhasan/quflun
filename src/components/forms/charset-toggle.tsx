'use client';

import { Checkbox } from '@/components/ui/checkbox';

interface CharsetToggleProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

/**
 * Single character set checkbox toggle.
 */
export function CharsetToggle({ label, checked, onChange }: CharsetToggleProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      {label}
    </label>
  );
}
