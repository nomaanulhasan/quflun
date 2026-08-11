'use client';

import type { FieldErrors } from 'react-hook-form';
import { FormField } from '@/components/ui/form-field';

// ─── Field Config Type ─────────────────────────────────────────────────────────

export interface FieldConfig {
  name: string;
  type?:
    'text' | 'number' | 'email' | 'tel' | 'url' | 'password' | 'search' | 'textarea' | 'checkbox';
  label: string;
  required?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  rows?: number;
  min?: number;
  max?: number;
  maxLength?: number;
  description?: string;
  trailing?: React.ReactNode;
  transform?: (value: string) => string;
  shouldValidate?: boolean;
}

// ─── Renderer Props ────────────────────────────────────────────────────────────

export interface FieldRendererProps {
  fields: FieldConfig[];
  /** Call watch(fieldName) to get field value */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch: (name: any) => unknown;
  /** Call setValue(name, value, options) to set field value */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: (name: any, value: any, options?: { shouldValidate?: boolean }) => void;
  /** react-hook-form errors object */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: FieldErrors<any>;
  disabled?: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Renders an array of field configs using FormField + react-hook-form's watch/setValue.
 * Pure field renderer — does NOT render form, submit buttons, or error banners.
 */
export function FieldRenderer({
  fields,
  watch,
  setValue,
  errors,
  disabled = false,
}: FieldRendererProps) {
  return (
    <>
      {fields.map((field) => {
        const value = (watch(field.name) as string) ?? '';
        const error = (errors[field.name] as { message?: string } | undefined)?.message;

        function handleChange(v: string) {
          const transformed = field.transform ? field.transform(v) : v;
          setValue(
            field.name,
            transformed,
            field.shouldValidate !== false ? { shouldValidate: true } : undefined
          );
        }

        // For textarea/checkbox, cast type narrowly so FormField accepts it
        if (field.type === 'textarea') {
          return (
            <FormField
              key={field.name}
              id={field.name}
              type="textarea"
              label={field.label}
              required={field.required}
              placeholder={field.placeholder}
              value={value}
              onChange={handleChange}
              disabled={disabled}
              error={error}
              description={field.description}
              rows={field.rows}
            />
          );
        }

        return (
          <FormField
            key={field.name}
            id={field.name}
            type={
              field.type as
                'text' | 'number' | 'email' | 'tel' | 'url' | 'password' | 'search' | undefined
            }
            label={field.label}
            required={field.required}
            placeholder={field.placeholder}
            autoFocus={field.autoFocus}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            error={error}
            description={field.description}
            trailing={field.trailing}
            min={field.min}
            max={field.max}
            maxLength={field.maxLength}
          />
        );
      })}
    </>
  );
}
