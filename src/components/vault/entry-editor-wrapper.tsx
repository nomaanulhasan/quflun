'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { EditEntryForm } from '@/components/vault/edit-entry-form';
import { EditNoteForm } from '@/components/vault/edit-note-form';
import type { VaultEntry } from '@/types';

interface EntryEditorWrapperProps {
  entryId: string;
  onBack: () => void;
}

export function EntryEditorWrapper({ entryId, onBack }: EntryEditorWrapperProps) {
  const [entry, setEntry] = useState<VaultEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { getServices } = await import('@/lib/runtime');
        const { engine } = await getServices();
        setEntry(engine.getEntry(entryId));
      } catch (err) {
        setError((err as Error).message);
      }
    })();
  }, [entryId]);

  if (error) return <p className="text-destructive py-8 text-center text-sm">{error}</p>;
  if (!entry) return <p className="text-muted-foreground text-sm">Loading...</p>;

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <PageHeader title={entry.type === 'note' ? 'Edit Note' : 'Edit Entry'} />
      {entry.type === 'note' ? (
        <EditNoteForm entry={entry} onBack={onBack} />
      ) : (
        <EditEntryForm entry={entry} onBack={onBack} />
      )}
    </div>
  );
}
