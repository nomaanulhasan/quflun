'use client';

import { CharsetToggle } from './charset-toggle';
import type { PasswordGeneratorConfig } from '@/lib/password-generator';

interface GeneratorOptionsProps {
  config: PasswordGeneratorConfig;
  onChange: (config: PasswordGeneratorConfig) => void;
}

/**
 * Password generator configuration controls (length + charsets).
 */
export function GeneratorOptions({ config, onChange }: GeneratorOptionsProps) {
  function handleLengthChange(value: string) {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    const clamped = Math.max(4, Math.min(128, num));
    onChange({ ...config, length: clamped });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label htmlFor="gen-length" className="shrink-0 text-sm">
          Length
        </label>
        <input
          id="gen-length"
          type="number"
          min={4}
          max={128}
          value={config.length}
          onChange={(e) => handleLengthChange(e.target.value)}
          className="border-input bg-background focus:ring-ring w-16 rounded-md border px-2 py-1 text-center text-sm focus:ring-2 focus:outline-none"
        />
      </div>
      <CharsetToggle
        label="Uppercase (A-Z)"
        checked={config.uppercase}
        onChange={(v) => onChange({ ...config, uppercase: v })}
      />
      <CharsetToggle
        label="Lowercase (a-z)"
        checked={config.lowercase}
        onChange={(v) => onChange({ ...config, lowercase: v })}
      />
      <CharsetToggle
        label="Digits (0-9)"
        checked={config.digits}
        onChange={(v) => onChange({ ...config, digits: v })}
      />
      <CharsetToggle
        label="Symbols (!@#...)"
        checked={config.symbols}
        onChange={(v) => onChange({ ...config, symbols: v })}
      />
    </div>
  );
}
