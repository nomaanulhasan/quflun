'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { FormError } from '@/components/ui/form-error';
import { FormActions } from '@/components/forms/form-actions';
import { PasswordField } from '@/components/forms/password-field';
import { GeneratorDialog } from '@/components/forms/generator-dialog';
import { FavoriteToggle } from '@/components/forms/favorite-toggle';
import { TagsInput } from '@/components/forms/tags-input';
import { DeleteDialog } from '@/components/vault/delete-dialog';
import { useVaultStore } from '@/components/providers';
import type { VaultEntry } from '@/types';

interface EditEntryFormProps {
  entry: VaultEntry;
}

export function EditEntryForm({ entry }: EditEntryFormProps) {
  const [title, setTitle] = useState(entry.title);
  const [username, setUsername] = useState(entry.username);
  const [password, setPassword] = useState(entry.password);
  const [url, setUrl] = useState(entry.url);
  const [notes, setNotes] = useState(entry.notes);
  const [tags, setTags] = useState<string[]>(entry.tags);
  const [favorite, setFavorite] = useState(entry.favorite);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editEntry = useVaultStore((s) => s.editEntry);
  const deleteEntry = useVaultStore((s) => s.deleteEntry);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!password) { setError('Password is required.'); return; }

    setLoading(true);
    try {
      await editEntry(entry.uuid, { title: title.trim(), username, password, url, notes, tags, favorite });
      router.replace('/vault');
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  async function handleDelete() {
    await deleteEntry(entry.uuid);
    router.replace('/vault');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="edit-title" className="text-sm font-medium">Title *</label>
        <Input id="edit-title" value={title} onChange={(e) => setTitle((e.target as HTMLInputElement).value)} disabled={loading} />
      </div>
      <div className="space-y-2">
        <label htmlFor="edit-username" className="text-sm font-medium">Username</label>
        <Input id="edit-username" value={username} onChange={(e) => setUsername((e.target as HTMLInputElement).value)} disabled={loading} />
      </div>
      <PasswordField id="edit-password" label="Password" value={password} onChange={setPassword} disabled={loading} required trailing={<GeneratorDialog onInsert={setPassword} />} />
      <div className="space-y-2">
        <label htmlFor="edit-url" className="text-sm font-medium">URL</label>
        <Input id="edit-url" value={url} onChange={(e) => setUrl((e.target as HTMLInputElement).value)} disabled={loading} />
      </div>
      <div className="space-y-2">
        <label htmlFor="edit-notes" className="text-sm font-medium">Notes</label>
        <textarea id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={loading} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Tags</label>
        <TagsInput value={tags} onChange={setTags} disabled={loading} />
      </div>
      <FavoriteToggle checked={favorite} onChange={setFavorite} disabled={loading} />
      <FormError message={error} />
      <FormActions submitLabel="Save Changes" loadingLabel="Saving..." loading={loading} disabled={!title.trim() || !password} onBack={() => router.back()} />
      <div className="border-t border-border pt-4">
        <DeleteDialog title={entry.title} onConfirm={handleDelete} disabled={loading} />
      </div>
    </form>
  );
}
