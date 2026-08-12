'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useVaultStore } from '@/components/providers';
import { Shell } from '@/components/layout/shell';
import { PageHeader } from '@/components/common/page-header';
import { EntryForm } from '@/components/vault/entry-form';
import { NoteForm } from '@/components/vault/note-form';
import { PinForm } from '@/components/vault/pin-form';

/**
 * New entry page — tabbed form for password entry, secure note, or application PIN.
 * Supports ?tab=note or ?tab=pin query params to open the relevant tab directly.
 */
export default function NewEntryPage() {
  const status = useVaultStore((s) => s.status);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const defaultTab = tabParam === 'note' ? 'note' : tabParam === 'pin' ? 'pin' : 'password';

  useEffect(() => {
    if (status === 'locked') router.replace('/');
  }, [status, router]);

  if (status !== 'unlocked') return null;

  const handleSuccess = () => router.replace('/vault');
  const handleBack = () => router.back();

  return (
    <Shell>
      <div className="mx-auto w-full max-w-lg space-y-6">
        <PageHeader title="New Entry" />
        <Tabs defaultValue={defaultTab}>
          <TabsList>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="pin">PIN</TabsTrigger>
            <TabsTrigger value="note">Secure Note</TabsTrigger>
          </TabsList>
          <TabsContent value="password" className="mt-4">
            <EntryForm onSuccess={handleSuccess} onBack={handleBack} />
          </TabsContent>
          <TabsContent value="pin" className="mt-4">
            <PinForm onSuccess={handleSuccess} onBack={handleBack} />
          </TabsContent>
          <TabsContent value="note" className="mt-4">
            <NoteForm onSuccess={handleSuccess} onBack={handleBack} />
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
}
