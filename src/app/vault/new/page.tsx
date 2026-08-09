'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useVaultStore } from '@/components/providers';
import { Shell } from '@/components/layout/shell';
import { PageHeader } from '@/components/common/page-header';
import { NewEntryForm } from '@/components/vault/new-entry-form';
import { NewNoteForm } from '@/components/vault/new-note-form';

/**
 * New entry page — tabbed form for password entry or secure note.
 * Supports ?tab=note query param to open the secure note tab directly.
 */
export default function NewEntryPage() {
  const status = useVaultStore((s) => s.status);
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'note' ? 'note' : 'password';

  useEffect(() => {
    if (status === 'locked') router.replace('/');
  }, [status, router]);

  if (status !== 'unlocked') return null;

  return (
    <Shell>
      <div className="mx-auto w-full max-w-lg space-y-6">
        <PageHeader title="New Entry" />

        <Tabs defaultValue={defaultTab}>
          <TabsList>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="note">Secure Note</TabsTrigger>
          </TabsList>
          <TabsContent value="password" className="mt-4">
            <NewEntryForm />
          </TabsContent>
          <TabsContent value="note" className="mt-4">
            <NewNoteForm />
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
}
