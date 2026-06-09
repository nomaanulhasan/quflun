'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { FormActions } from '@/components/forms/form-actions';
import { FavoriteToggle } from '@/components/forms/favorite-toggle';
import { TagsInput } from '@/components/forms/tags-input';
import { useVaultStore } from '@/components/providers';
import type { VaultEntry } from '@/types';

interface EditNoteFormProps {
  entry: VaultEntry;
}

export function EditNoteForm({ entry }: EditNoteFormProps) {
  const [title, setTitle] = useState(entry.title);
  const [body, setBody] = useState(entry.notes);
  const [tags, setTags] = useState<string[]>(entry.tags);
  const [favorite, setFavorite] = useState(entry.favorite);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editNote = useVaultStore((s) => s.editNote);
  const deleteEntry = useVaultStore((s) => s.deleteEntry);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!body.trim()) { setError('Body is required.'); return; }

    setLoading(true);
    try {
      await editNote(entry.uuid, { title: title.trim(), body: body.trim(), tags, favorite });
      router.replace('/vault');
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${entry.title}"? This cannot be undone.`)) return;
    setLoading(true);
    try { await deleteEntry(entry.uuid); router.replace('/vault'); }
    catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="edit-note-title" className="text-sm font-medium">Title *</label>
        <Input id="edit-note-title" value={title} onChange={(e) => setTitle((e.target as HTMLInputElement).value)} disabled={loading} autoFocus />
      </div>
      <div className="space-y-2">
        <label htmlFor="edit-note-body" className="text-sm font-medium">Content *</label>
        <textarea id="edit-note-body" value={body} onChange={(e) => setBody(e.target.value)} disabled={loading} rows={8} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Tags</label>
        <TagsInput value={tags} onChange={setTags} disabled={loading} />
      </div>
      <FavoriteToggle checked={favorite} onChange={setFavorite} disabled={loading} />
      <FormError message={error} />
      <FormActions submitLabel="Save Changes" loadingLabel="Saving..." loading={loading} disabled={!title.trim() || !body.trim()} onBack={() => router.back()} />
      <div className="border-t border-border pt-4">
        <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={loading} className="gap-1.5">
          <Trash2 className="h-3.5 w-3.5" /> Delete Note
        </Button>
      </div>
    </form>
  );
}
