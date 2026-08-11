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
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="border-border h-4 w-4 rounded"
      />
      {label}
    </label>
  );
}
