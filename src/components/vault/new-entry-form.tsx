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
import { CustomFieldsEditor } from '@/components/forms/custom-fields-editor';
import { useVaultStore } from '@/components/providers';
import type { CustomField } from '@/types';

export function NewEntryForm() {
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [favorite, setFavorite] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addEntry = useVaultStore((s) => s.addEntry);
  const router = useRouter();

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
      await addEntry({
        title: title.trim(),
        username,
        password,
        url,
        notes,
        tags,
        favorite,
        customFields: customFields.filter((f) => f.key.trim()),
      });
      router.replace('/vault');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="entry-title" className="text-sm font-medium">
          Title *
        </label>
        <Input
          id="entry-title"
          value={title}
          onChange={(e) => setTitle((e.target as HTMLInputElement).value)}
          placeholder="e.g. GitHub"
          disabled={loading}
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="entry-username" className="text-sm font-medium">
          Username
        </label>
        <Input
          id="entry-username"
          value={username}
          onChange={(e) => setUsername((e.target as HTMLInputElement).value)}
          placeholder="user@example.com"
          disabled={loading}
        />
      </div>
      <PasswordField
        id="entry-password"
        label="Password"
        value={password}
        onChange={setPassword}
        placeholder="Enter or generate"
        disabled={loading}
        required
        trailing={<GeneratorDialog onInsert={setPassword} />}
      />
      <div className="space-y-2">
        <label htmlFor="entry-url" className="text-sm font-medium">
          URL
        </label>
        <Input
          id="entry-url"
          value={url}
          onChange={(e) => setUrl((e.target as HTMLInputElement).value)}
          placeholder="https://example.com"
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="entry-notes" className="text-sm font-medium">
          Notes
        </label>
        <textarea
          id="entry-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes..."
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
      <FavoriteToggle checked={favorite} onChange={setFavorite} disabled={loading} />
      <FormError message={error} />
      <FormActions
        submitLabel="Save Entry"
        loadingLabel="Saving..."
        loading={loading}
        disabled={!title.trim() || !password}
        onBack={() => router.back()}
      />
    </form>
  );
}
