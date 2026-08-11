'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  required?: boolean;
  /** Slot for additional controls (e.g., generator button) rendered after the input */
  trailing?: React.ReactNode;
}

/**
 * Reusable password field with label, show/hide toggle, error display,
 * and optional trailing slot for generator buttons.
 */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder = 'Enter password',
  error,
  disabled = false,
  autoFocus = false,
  required = false,
  trailing,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <div className="flex gap-1">
        <div className="relative flex-1">
          <Input
            id={id}
            type={visible ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange((e.target as HTMLInputElement).value)}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            className="pr-10"
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            tabIndex={-1}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {trailing}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
