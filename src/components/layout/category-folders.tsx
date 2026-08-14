'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FolderOpen, FolderPlus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVaultStore } from '@/components/providers';
import { CATEGORY_NAME_MAX_LENGTH, MAX_CATEGORIES } from '@/lib/constants';

interface CategoryFoldersProps {
  onNavigate?: () => void;
}

/**
 * Renders category folders as sub-items inside the Vault nav group.
 * Provides inline create, rename, and delete.
 */
export function CategoryFolders({ onNavigate }: CategoryFoldersProps) {
  const status = useVaultStore((s) => s.status);
  const entries = useVaultStore((s) => s.entries);
  const createCategory = useVaultStore((s) => s.createCategory);
  const renameCategory = useVaultStore((s) => s.renameCategory);
  const deleteCategory = useVaultStore((s) => s.deleteCategory);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const activeFolder = searchParams.get('folder');

  const loadCategories = useCallback(async () => {
    try {
      const { getServices } = await import('@/lib/runtime');
      const { engine } = await getServices();
      setCategories(engine.getCategories());
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    if (status === 'unlocked') {
      loadCategories();
    } else {
      setCategories([]);
    }
  }, [status, entries, loadCategories]);

  if (status !== 'unlocked') return null;
  if (categories.length === 0 && !isCreating) {
    return (
      <div className="flex items-center justify-between py-1 pr-3 pl-7">
        <span className="text-muted-foreground">No folders</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-5 w-5 cursor-pointer"
          title="New folder"
          aria-label="New folder"
          onClick={() => {
            setIsCreating(true);
            setError(null);
          }}
        >
          <FolderPlus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    );
  }

  function navigateToFolder(folder: string) {
    router.push(`/vault?folder=${encodeURIComponent(folder)}`);
    onNavigate?.();
  }

  async function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setError(null);
    try {
      await createCategory(trimmed);
      setNewName('');
      setIsCreating(false);
      await loadCategories();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function startRename(name: string) {
    setEditingName(name);
    setEditValue(name);
    setError(null);
  }

  function cancelRename() {
    setEditingName(null);
    setEditValue('');
    setError(null);
  }

  async function handleRename(oldName: string) {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === oldName) {
      cancelRename();
      return;
    }
    setError(null);
    try {
      await renameCategory(oldName, trimmed);
      setEditingName(null);
      setEditValue('');
      if (activeFolder === oldName) {
        router.replace(`/vault?folder=${encodeURIComponent(trimmed)}`);
      }
      await loadCategories();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDelete(name: string) {
    setError(null);
    try {
      await deleteCategory(name);
      if (activeFolder === name) {
        router.replace('/vault');
      }
      await loadCategories();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-0.5 pt-1">
      {/* Folder sub-items */}
      {categories.map((cat) =>
        editingName === cat ? (
          <div key={cat} className="flex items-center gap-1 py-0.5 pr-2 pl-6">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              maxLength={CATEGORY_NAME_MAX_LENGTH}
              className="h-7 flex-1 text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename(cat);
                if (e.key === 'Escape') cancelRename();
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 cursor-pointer"
              title="Save"
              aria-label="Save rename"
              onClick={() => handleRename(cat)}
            >
              <Check className="h-3 w-3" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 cursor-pointer"
              title="Cancel"
              aria-label="Cancel rename"
              onClick={cancelRename}
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <FolderSubItem
            key={cat}
            name={cat}
            active={activeFolder === cat}
            onClick={() => navigateToFolder(cat)}
            onRename={() => startRename(cat)}
            onDelete={() => handleDelete(cat)}
          />
        )
      )}

      {/* Inline create */}
      {isCreating && (
        <div className="flex items-center gap-1 py-0.5 pr-2 pl-6">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Folder name"
            maxLength={CATEGORY_NAME_MAX_LENGTH}
            className="h-7 flex-1 text-xs"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') {
                setIsCreating(false);
                setNewName('');
              }
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 cursor-pointer"
            title="Create"
            aria-label="Create folder"
            onClick={handleCreate}
            disabled={!newName.trim()}
          >
            <Check className="h-3 w-3" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 cursor-pointer"
            title="Cancel"
            aria-label="Cancel"
            onClick={() => {
              setIsCreating(false);
              setNewName('');
            }}
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      )}

      {/* New folder button */}
      {!isCreating && categories.length < MAX_CATEGORIES && (
        <button
          type="button"
          className="text-muted-foreground/80 hover:text-foreground outline-muted flex w-full cursor-pointer items-center gap-2 rounded-md py-1.5 pr-3 pl-7 text-sm italic outline transition-colors"
          onClick={() => {
            setIsCreating(true);
            setError(null);
          }}
        >
          <FolderPlus className="h-4 w-4" aria-hidden="true" />
          New folder
        </button>
      )}

      {error && <p className="text-destructive py-1 pr-3 pl-7 text-xs">{error}</p>}
    </div>
  );
}

// ─── Folder Sub-Item ─────────────────────────────────────────────────────────

interface FolderSubItemProps {
  name: string;
  active: boolean;
  onClick: () => void;
  onRename: () => void;
  onDelete: () => void;
}

function FolderSubItem({ name, active, onClick, onRename, onDelete }: FolderSubItemProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-current={active ? 'page' : undefined}
      className={`group/folder flex cursor-pointer items-center gap-2 rounded-md py-2 pr-3 pl-7 text-sm transition-colors ${
        active
          ? 'bg-accent text-accent-foreground font-medium'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
      }`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <FolderOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="flex-1 truncate">{name}</span>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover/folder:opacity-100">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-5 w-5 cursor-pointer"
          title={`Rename "${name}"`}
          aria-label={`Rename "${name}"`}
          onClick={(e) => {
            e.stopPropagation();
            onRename();
          }}
        >
          <Pencil className="h-2.5 w-2.5" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-5 w-5 cursor-pointer"
          title={`Delete "${name}"`}
          aria-label={`Delete "${name}"`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-2.5 w-2.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
