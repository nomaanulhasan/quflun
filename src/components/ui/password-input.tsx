'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  'aria-describedby'?: string;
}

/**
 * Password input with visibility toggle button.
 * Reusable across all password fields in the application.
 */
export function PasswordInput({
  id,
  value,
  onChange,
  placeholder = 'Enter password',
  disabled = false,
  autoFocus = false,
  'aria-describedby': ariaDescribedBy,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange((e.target as HTMLInputElement).value)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className="pr-10"
        aria-describedby={ariaDescribedBy}
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
  );
}
