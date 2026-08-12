'use client';

import { useEffect, useState } from 'react';
import { useVaultStore } from '@/components/providers';
import { PageHeader } from '@/components/common/page-header';
import { EntryForm } from '@/components/vault/entry-form';
import { NoteForm } from '@/components/vault/note-form';
import { PinForm } from '@/components/vault/pin-form';
import { DeleteDialog } from '@/components/vault/delete-dialog';
import { Muted, Text } from '@/components/ui/typography';
import type { VaultEntry } from '@/types';

interface EntryEditorWrapperProps {
  entryId: string;
  onBack: () => void;
}

export function EntryEditorWrapper({ entryId, onBack }: EntryEditorWrapperProps) {
  const [entry, setEntry] = useState<VaultEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const deleteEntry = useVaultStore((s) => s.deleteEntry);

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

  if (error) return <Text className="text-destructive py-8 text-center">{error}</Text>;
  if (!entry) return <Muted>Loading...</Muted>;

  const titleMap = { note: 'Edit Note', pin: 'Edit PIN', password: 'Edit Entry' } as const;

  async function handleDelete() {
    await deleteEntry(entry!.uuid);
    onBack();
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title={titleMap[entry.type]} />
        <DeleteDialog title={entry.title} onConfirm={handleDelete} />
      </div>
      {entry.type === 'note' ? (
        <NoteForm entry={entry} onSuccess={onBack} onBack={onBack} />
      ) : entry.type === 'pin' ? (
        <PinForm entry={entry} onSuccess={onBack} onBack={onBack} />
      ) : (
        <EntryForm entry={entry} onSuccess={onBack} onBack={onBack} />
      )}
    </div>
  );
}
