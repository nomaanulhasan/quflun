'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FieldRenderer, type FieldConfig } from '@/components/forms/form-renderer';
import { FormError } from '@/components/ui/form-error';
import { FormActions } from '@/components/forms/form-actions';
import { FavoriteToggle } from '@/components/forms/favorite-toggle';
import { TagsInput } from '@/components/forms/tags-input';
import { Label } from '@/components/ui/label';
import { CopyAction } from '@/components/common/field-actions';
import { useCopyAction } from '@/hooks/use-copy-action';
import { useVaultStore } from '@/components/providers';
import { pinInputSchema, type PinFormData } from '@/lib/validators/entry-schemas';
import { PIN_MIN_LENGTH, PIN_MAX_LENGTH } from '@/lib/constants';
import type { VaultEntry } from '@/types';

interface PinFormProps {
  entry?: VaultEntry;
  onSuccess: () => void;
  onBack: () => void;
}

function pinTransform(value: string): string {
  return value.replace(/\D/g, '').slice(0, PIN_MAX_LENGTH);
}

export function PinForm({ entry, onSuccess, onBack }: PinFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const addPin = useVaultStore((s) => s.addPin);
  const editPin = useVaultStore((s) => s.editPin);
  const { copy, isCopied } = useCopyAction();
  const isEdit = !!entry;

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PinFormData>({
    resolver: zodResolver(pinInputSchema),
    defaultValues: {
      title: entry?.title ?? '',
      pin: entry?.password ?? '',
      notes: entry?.notes ?? '',
      tags: entry?.tags ?? [],
      favorite: entry?.favorite ?? false,
    },
  });

  const pin = watch('pin');

  const fields: FieldConfig[] = [
    {
      name: 'title',
      label: 'Title',
      required: true,
      placeholder: 'e.g. Banking App PIN',
      autoFocus: true,
    },
    {
      name: 'pin',
      type: 'password',
      label: `PIN (${PIN_MIN_LENGTH}–${PIN_MAX_LENGTH} digits)`,
      required: true,
      placeholder: 'Enter PIN',
      maxLength: PIN_MAX_LENGTH,
      transform: pinTransform,
      description: pin.length > 0 ? `${pin.length} digit${pin.length !== 1 ? 's' : ''}` : undefined,
      trailing: isEdit ? (
        <CopyAction
          copied={isCopied('pin')}
          label="Copy PIN"
          onCopy={(e) => {
            e.preventDefault();
            if (pin) copy(pin, 'PIN', 'pin');
          }}
          disabled={!pin || isSubmitting}
        />
      ) : undefined,
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Notes',
      placeholder: 'Optional notes (e.g. which app this PIN is for)...',
    },
  ];

  async function onSubmit(data: PinFormData) {
    setSubmitError(null);
    try {
      const payload = {
        title: data.title.trim(),
        pin: data.pin,
        notes: data.notes,
        tags: data.tags,
        favorite: data.favorite,
      };
      if (isEdit) {
        await editPin(entry.uuid, payload);
      } else {
        await addPin(payload);
      }
      onSuccess();
    } catch (err) {
      setSubmitError((err as Error).message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FieldRenderer
        fields={fields}
        watch={watch}
        setValue={setValue}
        errors={errors}
        disabled={isSubmitting}
      />
      <div className="space-y-2">
        <Label>Tags</Label>
        <TagsInput
          value={watch('tags')}
          onChange={(v) => setValue('tags', v)}
          disabled={isSubmitting}
        />
      </div>
      <FavoriteToggle
        checked={watch('favorite')}
        onChange={(v) => setValue('favorite', v)}
        disabled={isSubmitting}
      />
      <FormError message={submitError} />
      <FormActions
        submitLabel={isEdit ? 'Save Changes' : 'Save PIN'}
        loadingLabel="Saving..."
        loading={isSubmitting}
        disabled={!watch('title').trim() || pin.length < PIN_MIN_LENGTH}
        onBack={onBack}
      />
    </form>
  );
}
