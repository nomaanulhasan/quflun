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
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label htmlFor="gen-length" className="text-sm">Length: {config.length}</label>
        <input
          id="gen-length"
          type="range"
          min={4}
          max={128}
          value={config.length}
          onChange={(e) => onChange({ ...config, length: Number(e.target.value) })}
          className="w-32"
        />
      </div>
      <CharsetToggle label="Uppercase (A-Z)" checked={config.uppercase} onChange={(v) => onChange({ ...config, uppercase: v })} />
      <CharsetToggle label="Lowercase (a-z)" checked={config.lowercase} onChange={(v) => onChange({ ...config, lowercase: v })} />
      <CharsetToggle label="Digits (0-9)" checked={config.digits} onChange={(v) => onChange({ ...config, digits: v })} />
      <CharsetToggle label="Symbols (!@#...)" checked={config.symbols} onChange={(v) => onChange({ ...config, symbols: v })} />
    </div>
  );
}
