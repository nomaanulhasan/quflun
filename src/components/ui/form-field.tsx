'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Small } from '@/components/ui/typography';

// ─── Types ─────────────────────────────────────────────────────────────────────

type InputType = 'text' | 'number' | 'email' | 'tel' | 'url' | 'password' | 'search';

interface BaseFieldProps {
  id: string;
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

interface TextInputFieldProps extends BaseFieldProps {
  type?: InputType;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
  trailing?: React.ReactNode;
}

interface TextareaFieldProps extends BaseFieldProps {
  type: 'textarea';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

interface CheckboxFieldProps extends BaseFieldProps {
  type: 'checkbox';
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export type FormFieldProps = TextInputFieldProps | TextareaFieldProps | CheckboxFieldProps;

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Universal form field renderer.
 * Renders label + control + description + error for any input type.
 * Uses PasswordInput (with show/hide toggle) for type="password".
 */
function FormField(props: FormFieldProps) {
  const { id, label, description, error, required, disabled, className } = props;

  // ─── Checkbox ────────────────────────────────────────────────────────
  if (props.type === 'checkbox') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Checkbox
          id={id}
          checked={props.checked}
          onCheckedChange={props.onCheckedChange}
          disabled={disabled}
        />
        {label && <Label htmlFor={id}>{label}</Label>}
        {error && <Small className="text-destructive">{error}</Small>}
      </div>
    );
  }

  // ─── Textarea ────────────────────────────────────────────────────────
  if (props.type === 'textarea') {
    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <Label htmlFor={id}>
            {label}
            {required && ' *'}
          </Label>
        )}
        <Textarea
          id={id}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          disabled={disabled}
          rows={props.rows ?? 3}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : description ? `${id}-desc` : undefined}
        />
        <FieldHint id={id} description={description} error={error} />
      </div>
    );
  }

  // ─── Password (with show/hide toggle) ────────────────────────────────
  if (props.type === 'password') {
    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <Label htmlFor={id}>
            {label}
            {required && ' *'}
          </Label>
        )}
        {props.trailing ? (
          <div className="flex gap-1">
            <div className="flex-1">
              <PasswordInput
                id={id}
                value={props.value as string}
                onChange={props.onChange}
                placeholder={props.placeholder}
                disabled={disabled}
                autoFocus={props.autoFocus}
                aria-describedby={error ? `${id}-error` : description ? `${id}-desc` : undefined}
              />
            </div>
            {props.trailing}
          </div>
        ) : (
          <PasswordInput
            id={id}
            value={props.value as string}
            onChange={props.onChange}
            placeholder={props.placeholder}
            disabled={disabled}
            autoFocus={props.autoFocus}
            aria-describedby={error ? `${id}-error` : description ? `${id}-desc` : undefined}
          />
        )}
        <FieldHint id={id} description={description} error={error} />
      </div>
    );
  }

  // ─── Default: text/number/email/tel/url/search ───────────────────────
  const inputType = props.type ?? 'text';

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && ' *'}
        </Label>
      )}
      {props.trailing ? (
        <div className="flex gap-1">
          <Input
            id={id}
            type={inputType}
            value={props.value}
            onChange={(e) => props.onChange((e.target as HTMLInputElement).value)}
            placeholder={props.placeholder}
            disabled={disabled}
            autoFocus={props.autoFocus}
            min={props.min}
            max={props.max}
            maxLength={props.maxLength}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : description ? `${id}-desc` : undefined}
            className="flex-1"
          />
          {props.trailing}
        </div>
      ) : (
        <Input
          id={id}
          type={inputType}
          value={props.value}
          onChange={(e) => props.onChange((e.target as HTMLInputElement).value)}
          placeholder={props.placeholder}
          disabled={disabled}
          autoFocus={props.autoFocus}
          min={props.min}
          max={props.max}
          maxLength={props.maxLength}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : description ? `${id}-desc` : undefined}
        />
      )}
      <FieldHint id={id} description={description} error={error} />
    </div>
  );
}

// ─── Shared hint/error display ─────────────────────────────────────────────────

function FieldHint({
  id,
  description,
  error,
}: {
  id: string;
  description?: string;
  error?: string;
}) {
  if (error)
    return (
      <Small id={`${id}-error`} className="text-destructive">
        {error}
      </Small>
    );
  if (description) return <Small id={`${id}-desc`}>{description}</Small>;
  return null;
}

export { FormField };
