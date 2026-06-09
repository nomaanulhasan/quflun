'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { FormError } from '@/components/ui/form-error';
import { FormActions } from '@/components/forms/form-actions';
import { FavoriteToggle } from '@/components/forms/favorite-toggle';
import { TagsInput } from '@/components/forms/tags-input';
import { useVaultStore } from '@/components/providers';

export function NewNoteForm() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [favorite, setFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addNote = useVaultStore((s) => s.addNote);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!body.trim()) { setError('Body is required.'); return; }

    setLoading(true);
    try {
      await addNote({ title: title.trim(), body: body.trim(), tags, favorite });
      router.replace('/vault');
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="note-title" className="text-sm font-medium">Title *</label>
        <Input id="note-title" value={title} onChange={(e) => setTitle((e.target as HTMLInputElement).value)} placeholder="e.g. SSH Keys" disabled={loading} autoFocus />
      </div>
      <div className="space-y-2">
        <label htmlFor="note-body" className="text-sm font-medium">Content *</label>
        <textarea id="note-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Enter your secure note..." disabled={loading} rows={8} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Tags</label>
        <TagsInput value={tags} onChange={setTags} disabled={loading} />
      </div>
      <FavoriteToggle checked={favorite} onChange={setFavorite} disabled={loading} />
      <FormError message={error} />
      <FormActions submitLabel="Save Note" loadingLabel="Saving..." loading={loading} disabled={!title.trim() || !body.trim()} onBack={() => router.back()} />
    </form>
  );
}
