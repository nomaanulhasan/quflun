'use client';

import { useState } from 'react';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CustomField } from '@/types';

interface CustomFieldsEditorProps {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
  disabled?: boolean;
}

/**
 * Editor for custom key-value fields on entries.
 * Supports protected (masked) and plain text fields.
 */
export function CustomFieldsEditor({
  fields,
  onChange,
  disabled = false,
}: CustomFieldsEditorProps) {
  function addField() {
    onChange([...fields, { key: '', value: '', protected: false }]);
  }

  function updateField(index: number, patch: Partial<CustomField>) {
    const updated = fields.map((f, i) => (i === index ? { ...f, ...patch } : f));
    onChange(updated);
  }

  function removeField(index: number) {
    onChange(fields.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Custom Fields</label>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={addField}
          disabled={disabled}
          className="gap-1"
        >
          <Plus className="h-3 w-3" aria-hidden="true" />
          Add Field
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-muted-foreground text-xs">
          No custom fields. Add fields for API keys, recovery codes, etc.
        </p>
      )}

      {fields.map((field, i) => (
        <CustomFieldRow
          key={i}
          field={field}
          onUpdate={(patch) => updateField(i, patch)}
          onRemove={() => removeField(i)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

function CustomFieldRow({
  field,
  onUpdate,
  onRemove,
  disabled,
}: {
  field: CustomField;
  onUpdate: (patch: Partial<CustomField>) => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex items-start gap-1.5">
      <Input
        placeholder="Field name"
        value={field.key}
        onChange={(e) => onUpdate({ key: (e.target as HTMLInputElement).value })}
        disabled={disabled}
        className="h-8 flex-1 text-xs"
        aria-label="Field name"
      />
      <div className="relative flex-2">
        <Input
          placeholder="Value"
          type={field.protected && !revealed ? 'password' : 'text'}
          value={field.value}
          onChange={(e) => onUpdate({ value: (e.target as HTMLInputElement).value })}
          disabled={disabled}
          className="h-8 pr-8 text-xs"
          aria-label="Field value"
        />
        {field.protected && (
          <button
            type="button"
            onClick={() => setRevealed(!revealed)}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
            aria-label={revealed ? 'Hide value' : 'Show value'}
            tabIndex={-1}
          >
            {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </button>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        title={field.protected ? 'Make plain text' : 'Make secret'}
        aria-label={field.protected ? 'Make plain text' : 'Make secret'}
        onClick={() => onUpdate({ protected: !field.protected })}
        disabled={disabled}
      >
        {field.protected ? (
          <EyeOff className="h-3 w-3 text-amber-500" />
        ) : (
          <Eye className="h-3 w-3" />
        )}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        title="Remove field"
        aria-label="Remove field"
        onClick={onRemove}
        disabled={disabled}
      >
        <Trash2 className="text-destructive h-3 w-3" />
      </Button>
    </div>
  );
}
