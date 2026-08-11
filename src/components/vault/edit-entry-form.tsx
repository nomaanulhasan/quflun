'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { FormError } from '@/components/ui/form-error';
import { FormActions } from '@/components/forms/form-actions';
import { PasswordField } from '@/components/forms/password-field';
import { GeneratorDialog } from '@/components/forms/generator-dialog';
import { FavoriteToggle } from '@/components/forms/favorite-toggle';
import { TagsInput } from '@/components/forms/tags-input';
import { CustomFieldsEditor } from '@/components/forms/custom-fields-editor';
import { AttachmentsEditor } from '@/components/forms/attachments-editor';
import { DeleteDialog } from '@/components/vault/delete-dialog';
import { CopyAction, OpenLinkAction } from '@/components/common/field-actions';
import { useCopyAction } from '@/hooks/use-copy-action';
import { useVaultStore } from '@/components/providers';
import type { VaultEntry, CustomField, AttachmentMeta } from '@/types';

interface EditEntryFormProps {
  entry: VaultEntry;
  onBack: () => void;
}

export function EditEntryForm({ entry, onBack }: EditEntryFormProps) {
  const [title, setTitle] = useState(entry.title);
  const [username, setUsername] = useState(entry.username);
  const [password, setPassword] = useState(entry.password);
  const [url, setUrl] = useState(entry.url);
  const [notes, setNotes] = useState(entry.notes);
  const [tags, setTags] = useState<string[]>(entry.tags);
  const [favorite, setFavorite] = useState(entry.favorite);
  const [customFields, setCustomFields] = useState<CustomField[]>(entry.customFields);
  const [attachments, setAttachments] = useState<AttachmentMeta[]>(entry.attachments);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editEntry = useVaultStore((s) => s.editEntry);
  const deleteEntry = useVaultStore((s) => s.deleteEntry);
  const { copy, isCopied } = useCopyAction();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);
    try {
      await editEntry(entry.uuid, {
        title: title.trim(),
        username,
        password,
        url,
        notes,
        tags,
        favorite,
        customFields: customFields.filter((f) => f.key.trim()),
      });
      onBack();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    await deleteEntry(entry.uuid);
    onBack();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="edit-title" className="text-sm font-medium">
          Title *
        </label>
        <Input
          id="edit-title"
          value={title}
          onChange={(e) => setTitle((e.target as HTMLInputElement).value)}
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="edit-username" className="text-sm font-medium">
          Username
        </label>
        <div className="flex gap-1">
          <Input
            id="edit-username"
            value={username}
            onChange={(e) => setUsername((e.target as HTMLInputElement).value)}
            disabled={loading}
            className="flex-1"
          />
          <CopyAction
            copied={isCopied('username')}
            label="Copy username"
            onCopy={(e) => {
              e.preventDefault();
              if (username) copy(username, 'Username', 'username');
            }}
            disabled={!username || loading}
          />
        </div>
      </div>
      <PasswordField
        id="edit-password"
        label="Password"
        value={password}
        onChange={setPassword}
        disabled={loading}
        required
        trailing={
          <div className="flex gap-0.5">
            <CopyAction
              copied={isCopied('password')}
              label="Copy password"
              onCopy={(e) => {
                e.preventDefault();
                if (password) copy(password, 'Password', 'password');
              }}
              disabled={!password || loading}
            />
            <GeneratorDialog onInsert={setPassword} />
          </div>
        }
      />
      <div className="space-y-2">
        <label htmlFor="edit-url" className="text-sm font-medium">
          URL
        </label>
        <div className="flex gap-1">
          <Input
            id="edit-url"
            value={url}
            onChange={(e) => setUrl((e.target as HTMLInputElement).value)}
            disabled={loading}
            className="flex-1"
          />
          <CopyAction
            copied={isCopied('url')}
            label="Copy URL"
            onCopy={(e) => {
              e.preventDefault();
              if (url) copy(url, 'URL', 'url');
            }}
            disabled={!url || loading}
          />
          <OpenLinkAction url={url} disabled={loading} />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="edit-notes" className="text-sm font-medium">
          Notes
        </label>
        <textarea
          id="edit-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={loading}
          rows={3}
          className="border-input bg-background placeholder:text-muted-foreground focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none disabled:opacity-50"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Tags</label>
        <TagsInput value={tags} onChange={setTags} disabled={loading} />
      </div>
      <CustomFieldsEditor fields={customFields} onChange={setCustomFields} disabled={loading} />
      <AttachmentsEditor
        attachments={attachments}
        entryUuid={entry.uuid}
        onAdd={async (filename, data) => {
          const { getServices } = await import('@/lib/runtime');
          const { engine } = await getServices();
          await engine.addAttachment(entry.uuid, filename, data);
          const updated = engine.getEntry(entry.uuid);
          setAttachments(updated.attachments);
        }}
        onRemove={async (filename) => {
          const { getServices } = await import('@/lib/runtime');
          const { engine } = await getServices();
          await engine.removeAttachment(entry.uuid, filename);
          const updated = engine.getEntry(entry.uuid);
          setAttachments(updated.attachments);
        }}
        onDownload={async (filename) => {
          const { getServices } = await import('@/lib/runtime');
          const { engine } = await getServices();
          const buffer = engine.getAttachment(entry.uuid, filename);
          const blob = new Blob([buffer]);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
        }}
        disabled={loading}
      />
      <FavoriteToggle checked={favorite} onChange={setFavorite} disabled={loading} />
      <FormError message={error} />
      <FormActions
        submitLabel="Save Changes"
        loadingLabel="Saving..."
        loading={loading}
        disabled={!title.trim() || !password}
        onBack={onBack}
      />
      <div className="border-border border-t pt-4">
        <DeleteDialog title={entry.title} onConfirm={handleDelete} disabled={loading} />
      </div>
    </form>
  );
}
