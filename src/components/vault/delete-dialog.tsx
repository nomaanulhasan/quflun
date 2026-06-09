'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface DeleteDialogProps {
  title: string;
  onConfirm: () => Promise<void>;
  disabled?: boolean;
}

/**
 * Delete confirmation dialog — identifies entry by title.
 * Requirement 6.1: confirmation prompt identifying entry by title.
 */
export function DeleteDialog({ title, onConfirm, disabled = false }: DeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button type="button" variant="destructive" size="sm" disabled={disabled} className="gap-1.5" />}
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </DialogTrigger>
      <DialogContent className="max-w-sm p-6">
        <DialogTitle className="text-base font-semibold">Delete &ldquo;{title}&rdquo;?</DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          This action cannot be undone. The entry will be permanently removed.
        </DialogDescription>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
