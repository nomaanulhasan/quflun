'use client';

import { Clipboard, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CopyButtonProps {
  /** Whether the button shows the "copied" check state */
  copied: boolean;
  /** Accessible label, e.g. "Copy password" */
  label: string;
  /** Click handler */
  onClick: (e: React.MouseEvent) => void;
  /** Disable the button */
  disabled?: boolean;
  /** Button size variant */
  size?: 'icon-xs' | 'icon-sm' | 'icon' | 'icon-lg';
}

/**
 * Reusable copy button with clipboard → check icon transition.
 * Does NOT perform clipboard logic — that's handled by the caller via useCopyAction.
 */
export function CopyButton({ copied, label, onClick, disabled = false, size = 'icon-sm' }: CopyButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
      ) : (
        <Clipboard className="h-3.5 w-3.5" aria-hidden="true" />
      )}
    </Button>
  );
}
