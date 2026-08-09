'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVaultStore } from '@/components/providers';
import { Shell } from '@/components/layout/shell';
import { VaultListView } from '@/components/vault/vault-list-view';
import { EntryEditorWrapper } from '@/components/vault/entry-editor-wrapper';
import { LockScreen } from '@/components/layout/lock-screen';
import { useBackupReminder } from '@/hooks/use-backup-reminder';

export default function VaultPage() {
  const status = useVaultStore((s) => s.status);
  const vaultId = useVaultStore((s) => s.vaultId);
  const entries = useVaultStore((s) => s.entries);
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCounter, setEditCounter] = useState(0);

  useBackupReminder();

  function openEditor(id: string) {
    setEditingId(id);
    setEditCounter((c) => c + 1);
  }

  useEffect(() => {
    if (status === 'locked' && !vaultId) router.replace('/');
  }, [status, vaultId, router]);

  if (status === 'locked' && vaultId) return <LockScreen />;
  if (status !== 'unlocked') return null;

  if (editingId) {
    return (
      <Shell>
        <EntryEditorWrapper key={`${editingId}-${editCounter}`} entryId={editingId} onBack={() => setEditingId(null)} />
      </Shell>
    );
  }

  return (
    <Shell>
      <VaultListView entries={entries} onEdit={openEditor} onNew={() => router.push('/vault/new')} />
    </Shell>
  );
}
