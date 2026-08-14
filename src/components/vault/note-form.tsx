'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FieldRenderer, type FieldConfig } from '@/components/forms/form-renderer';
import { FormError } from '@/components/ui/form-error';
import { FormActions } from '@/components/forms/form-actions';
import { FavoriteToggle } from '@/components/forms/favorite-toggle';
import { CategorySelect } from '@/components/forms/category-select';
import { TagsInput } from '@/components/forms/tags-input';
import { Label } from '@/components/ui/label';
import { useVaultStore } from '@/components/providers';
import { noteInputSchema, type NoteFormData } from '@/lib/validators/entry-schemas';
import {
  TITLE_MAX_LENGTH,
  NOTE_BODY_MAX_LENGTH,
  TAG_MAX_LENGTH,
  MAX_TAGS_PER_ENTRY,
} from '@/lib/constants';
import type { VaultEntry } from '@/types';

interface NoteFormProps {
  entry?: VaultEntry;
  onSuccess: () => void;
  onBack: () => void;
}

const NOTE_FIELDS: FieldConfig[] = [
  {
    name: 'title',
    label: 'Title',
    required: true,
    placeholder: 'e.g. SSH Keys',
    autoFocus: true,
    maxLength: TITLE_MAX_LENGTH,
  },
  {
    name: 'body',
    type: 'textarea',
    label: 'Content',
    required: true,
    placeholder: 'Enter your secure note...',
    rows: 8,
    maxLength: NOTE_BODY_MAX_LENGTH,
  },
];

export function NoteForm({ entry, onSuccess, onBack }: NoteFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [category, setCategory] = useState(entry?.category ?? '');
  const addNote = useVaultStore((s) => s.addNote);
  const editNote = useVaultStore((s) => s.editNote);
  const setEntryCategory = useVaultStore((s) => s.setCategory);
  const isEdit = !!entry;

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NoteFormData>({
    resolver: zodResolver(noteInputSchema),
    mode: 'onBlur',
    defaultValues: {
      title: entry?.title ?? '',
      body: entry?.notes ?? '',
      tags: entry?.tags ?? [],
      favorite: entry?.favorite ?? false,
    },
  });

  async function onSubmit(data: NoteFormData) {
    setSubmitError(null);
    try {
      const payload = {
        title: data.title.trim(),
        body: data.body.trim(),
        tags: data.tags,
        favorite: data.favorite,
        category: category || undefined,
      };
      if (isEdit) {
        await editNote(entry.uuid, payload);
        await setEntryCategory(entry.uuid, category || null);
      } else {
        const meta = await addNote(payload);
        if (category) {
          await setEntryCategory(meta.uuid, category);
        }
      }
      onSuccess();
    } catch (err) {
      setSubmitError((err as Error).message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FieldRenderer
        fields={NOTE_FIELDS}
        watch={watch}
        setValue={setValue}
        errors={errors}
        disabled={isSubmitting}
      />
      <CategorySelect value={category} onChange={setCategory} disabled={isSubmitting} />
      <div className="space-y-2">
        <Label>Tags</Label>
        <TagsInput
          value={watch('tags')}
          onChange={(v) => setValue('tags', v, { shouldValidate: true })}
          disabled={isSubmitting}
          maxTags={MAX_TAGS_PER_ENTRY}
          maxTagLength={TAG_MAX_LENGTH}
        />
        {errors.tags && (
          <p className="text-destructive text-xs">
            {errors.tags.message || errors.tags.root?.message || 'Invalid tags.'}
          </p>
        )}
      </div>
      <FavoriteToggle
        checked={watch('favorite')}
        onChange={(v) => setValue('favorite', v)}
        disabled={isSubmitting}
      />
      <FormError message={submitError} />
      <FormActions
        submitLabel={isEdit ? 'Save Changes' : 'Save Note'}
        loadingLabel="Saving..."
        loading={isSubmitting}
        onBack={onBack}
      />
    </form>
  );
}
