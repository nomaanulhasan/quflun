'use client';

import { useState, useEffect } from 'react';
import { FolderOpen, Trash2, X, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVaultStore } from '@/components/providers';

interface BulkActionBarProps {
  selectedIds: Set<string>;
  onClearSelection: () => void;
  onComplete: () => void;
}

/**
 * Floating bottom action bar for bulk operations on selected entries.
 * Shows move-to-folder, remove-from-folder, and delete actions.
 */
export function BulkActionBar({ selectedIds, onClearSelection, onComplete }: BulkActionBarProps) {
  const setCategory = useVaultStore((s) => s.setCategory);
  const deleteEntry = useVaultStore((s) => s.deleteEntry);

  const [categories, setCategories] = useState<string[]>([]);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (showFolderMenu) {
      let cancelled = false;
      async function load() {
        const { getServices } = await import('@/lib/runtime');
        const { engine } = await getServices();
        if (!cancelled) setCategories(engine.getCategories());
      }
      load();
      return () => {
        cancelled = true;
      };
    }
  }, [showFolderMenu]);

  async function handleMoveToFolder(folder: string | null) {
    setShowFolderMenu(false);
    setProcessing(true);
    try {
      for (const id of selectedIds) {
        await setCategory(id, folder);
      }
      onComplete();
    } finally {
      setProcessing(false);
    }
  }

  async function handleDelete() {
    const count = selectedIds.size;
    const confirmed = window.confirm(
      `Delete ${count} ${count === 1 ? 'entry' : 'entries'}? This cannot be undone.`
    );
    if (!confirmed) return;

    setProcessing(true);
    try {
      for (const id of selectedIds) {
        await deleteEntry(id);
      }
      onComplete();
    } finally {
      setProcessing(false);
    }
  }

  const count = selectedIds.size;

  return (
    <div className="bg-card border-border absolute right-4 bottom-4 left-0 z-20 flex items-center gap-3 rounded-lg border p-3 shadow-lg md:left-4">
      <span className="text-foreground text-sm font-medium">{count} selected</span>

      <div className="flex-1" />

      {/* Move to folder */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowFolderMenu((v) => !v)}
          disabled={processing}
        >
          <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
          Move to folder
        </Button>

        {showFolderMenu && (
          <div className="bg-popover border-border absolute right-0 bottom-full mb-2 max-h-48 w-44 overflow-y-auto rounded-md border py-1 shadow-md">
            <button
              type="button"
              className="hover:bg-accent flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-xs"
              onClick={() => handleMoveToFolder(null)}
            >
              <Inbox className="h-3 w-3" aria-hidden="true" />
              Uncategorized
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className="hover:bg-accent flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-xs"
                onClick={() => handleMoveToFolder(cat)}
              >
                <FolderOpen className="h-3 w-3" aria-hidden="true" />
                {cat}
              </button>
            ))}
            {categories.length === 0 && (
              <p className="text-muted-foreground px-3 py-1.5 text-xs">No folders yet</p>
            )}
          </div>
        )}
      </div>

      {/* Delete */}
      <Button
        variant="destructive"
        size="sm"
        className="gap-1.5"
        onClick={handleDelete}
        disabled={processing}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        Delete
      </Button>

      {/* Cancel */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5"
        onClick={onClearSelection}
        disabled={processing}
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
        Cancel
      </Button>
    </div>
  );
}
