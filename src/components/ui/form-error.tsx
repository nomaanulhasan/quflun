'use client';

import { AlertTriangle } from 'lucide-react';

interface FormErrorProps {
  message: string | null;
  id?: string;
}

/**
 * Inline form error alert with icon.
 * Renders nothing when message is null.
 */
export function FormError({ message, id }: FormErrorProps) {
  if (!message) return null;

  return (
    <div
      id={id}
      role="alert"
      className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-md p-3 text-sm"
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
