"use client";

import { Star } from "lucide-react";

interface FavoriteToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

/**
 * Favorite checkbox toggle with star icon.
 */
export function FavoriteToggle({
  checked,
  onChange,
  disabled = false,
}: FavoriteToggleProps) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-4 w-4 rounded border-border hidden"
      />
      <Star
        className={`h-4 w-4 ${checked ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
        aria-hidden="true"
      />
      Mark as favorite
    </label>
  );
}
