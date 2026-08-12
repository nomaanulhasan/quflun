'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FieldRenderer, type FieldConfig } from '@/components/forms/form-renderer';
import { FormError } from '@/components/ui/form-error';
import { FormActions } from '@/components/forms/form-actions';
import { GeneratorDialog } from '@/components/forms/generator-dialog';
import { FavoriteToggle } from '@/components/forms/favorite-toggle';
import { TagsInput } from '@/components/forms/tags-input';
import { CustomFieldsEditor } from '@/components/forms/custom-fields-editor';
import { AttachmentsEditor } from '@/components/forms/attachments-editor';
import { Label } from '@/components/ui/label';
import { CopyAction, OpenLinkAction } from '@/components/common/field-actions';
import { useCopyAction } from '@/hooks/use-copy-action';
import { useVaultStore } from '@/components/providers';
import { entryInputSchema, type EntryFormData } from '@/lib/validators/entry-schemas';
import type { VaultEntry, CustomField, AttachmentMeta } from '@/types';

interface EntryFormProps {
  entry?: VaultEntry;
  onSuccess: () => void;
  onBack: () => void;
}

export function EntryForm({ entry, onSuccess, onBack }: EntryFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [customFields, setCustomFields] = useState<CustomField[]>(entry?.customFields ?? []);
  const [attachments, setAttachments] = useState<AttachmentMeta[]>(entry?.attachments ?? []);
  const addEntry = useVaultStore((s) => s.addEntry);
  const editEntry = useVaultStore((s) => s.editEntry);
  const { copy, isCopied } = useCopyAction();
  const isEdit = !!entry;

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EntryFormData>({
    resolver: zodResolver(entryInputSchema),
    mode: 'onBlur',
    defaultValues: {
      title: entry?.title ?? '',
      username: entry?.username ?? '',
      password: entry?.password ?? '',
      url: entry?.url ?? '',
      notes: entry?.notes ?? '',
      tags: entry?.tags ?? [],
      favorite: entry?.favorite ?? false,
    },
  });

  const username = watch('username');
  const password = watch('password');
  const url = watch('url');

  const fields: FieldConfig[] = [
    { name: 'title', label: 'Title', required: true, placeholder: 'e.g. GitHub', autoFocus: true },
    {
      name: 'username',
      label: 'Username',
      placeholder: 'user@example.com',
      trailing: isEdit ? (
        <CopyAction
          copied={isCopied('username')}
          label="Copy username"
          onCopy={(e) => {
            e.preventDefault();
            if (username) copy(username, 'Username', 'username');
          }}
          disabled={!username || isSubmitting}
        />
      ) : undefined,
    },
    {
      name: 'password',
      type: 'password',
      label: 'Password',
      required: true,
      placeholder: 'Enter or generate',
      trailing: (
        <div className="flex gap-0.5">
          {isEdit && (
            <CopyAction
              copied={isCopied('password')}
              label="Copy password"
              onCopy={(e) => {
                e.preventDefault();
                if (password) copy(password, 'Password', 'password');
              }}
              disabled={!password || isSubmitting}
            />
          )}
          <GeneratorDialog onInsert={(v) => setValue('password', v, { shouldValidate: true })} />
        </div>
      ),
    },
    {
      name: 'url',
      label: 'URL',
      placeholder: 'https://example.com',
      trailing: isEdit ? (
        <>
          <CopyAction
            copied={isCopied('url')}
            label="Copy URL"
            onCopy={(e) => {
              e.preventDefault();
              if (url) copy(url, 'URL', 'url');
            }}
            disabled={!url || isSubmitting}
          />
          <OpenLinkAction url={url} disabled={isSubmitting} />
        </>
      ) : undefined,
    },
    { name: 'notes', type: 'textarea', label: 'Notes', placeholder: 'Optional notes...' },
  ];

  async function onSubmit(data: EntryFormData) {
    setSubmitError(null);
    try {
      const payload = {
        title: data.title.trim(),
        username: data.username,
        password: data.password,
        url: data.url,
        notes: data.notes,
        tags: data.tags,
        favorite: data.favorite,
        customFields: customFields.filter((f) => f.key.trim()),
      };
      if (isEdit) {
        await editEntry(entry.uuid, payload);
      } else {
        await addEntry(payload);
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
      <CustomFieldsEditor
        fields={customFields}
        onChange={setCustomFields}
        disabled={isSubmitting}
      />
      {isEdit && entry && (
        <AttachmentsEditor
          attachments={attachments}
          entryUuid={entry.uuid}
          onAdd={async (filename, data) => {
            const { getServices } = await import('@/lib/runtime');
            const { engine } = await getServices();
            await engine.addAttachment(entry.uuid, filename, data);
            setAttachments(engine.getEntry(entry.uuid).attachments);
          }}
          onRemove={async (filename) => {
            const { getServices } = await import('@/lib/runtime');
            const { engine } = await getServices();
            await engine.removeAttachment(entry.uuid, filename);
            setAttachments(engine.getEntry(entry.uuid).attachments);
          }}
          onDownload={async (filename) => {
            const { getServices } = await import('@/lib/runtime');
            const { engine } = await getServices();
            const buffer = engine.getAttachment(entry.uuid, filename);
            const blob = new Blob([buffer]);
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(downloadUrl);
          }}
          disabled={isSubmitting}
        />
      )}
      <FavoriteToggle
        checked={watch('favorite')}
        onChange={(v) => setValue('favorite', v)}
        disabled={isSubmitting}
      />
      <FormError message={submitError} />
      <FormActions
        submitLabel={isEdit ? 'Save Changes' : 'Save Entry'}
        loadingLabel="Saving..."
        loading={isSubmitting}
        onBack={onBack}
      />
    </form>
  );
}
