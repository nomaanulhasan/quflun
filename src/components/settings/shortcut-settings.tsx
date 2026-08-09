'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/components/providers';
import { DEFAULT_SHORTCUTS } from '@/stores/ui-store';
import { SettingsCard } from './settings-card';
import type { ShortcutId, ShortcutBinding } from '@/types';

// ─── Label Map ─────────────────────────────────────────────────────────────────

const SHORTCUT_LABELS: Record<ShortcutId, string> = {
  commandPalette: 'Command Palette',
  newEntry: 'New Entry',
  newNote: 'New Secure Note',
  lockVault: 'Lock Vault',
};

const SHORTCUT_ORDER: ShortcutId[] = ['commandPalette', 'newEntry', 'newNote', 'lockVault'];

// ─── Component ─────────────────────────────────────────────────────────────────

export function ShortcutSettings() {
  const shortcuts = useUIStore((s) => s.settings.shortcuts);
  const updateSettings = useUIStore((s) => s.updateSettings);
  const [recording, setRecording] = useState<ShortcutId | null>(null);

  const handleReset = useCallback(() => {
    updateSettings({ shortcuts: { ...DEFAULT_SHORTCUTS } });
  }, [updateSettings]);

  const handleUpdate = useCallback(
    (id: ShortcutId, binding: ShortcutBinding) => {
      updateSettings({ shortcuts: { ...shortcuts, [id]: binding } });
      setRecording(null);
    },
    [shortcuts, updateSettings]
  );

  return (
    <SettingsCard title="Keyboard Shortcuts" description="Click a shortcut to reassign it. Press Escape to cancel.">
      <div className="space-y-2">
        {SHORTCUT_ORDER.map((id) => (
          <ShortcutRow
            key={id}
            id={id}
            label={SHORTCUT_LABELS[id]}
            binding={shortcuts?.[id] ?? DEFAULT_SHORTCUTS[id]}
            isRecording={recording === id}
            onStartRecording={() => setRecording(id)}
            onRecord={handleUpdate}
            onCancel={() => setRecording(null)}
          />
        ))}
      </div>
      <Button variant="ghost" size="sm" onClick={handleReset} className="mt-2 gap-1.5 text-xs">
        <RotateCcw className="h-3 w-3" aria-hidden="true" />
        Reset to defaults
      </Button>
    </SettingsCard>
  );
}

// ─── Shortcut Row ──────────────────────────────────────────────────────────────

interface ShortcutRowProps {
  id: ShortcutId;
  label: string;
  binding: ShortcutBinding;
  isRecording: boolean;
  onStartRecording: () => void;
  onRecord: (id: ShortcutId, binding: ShortcutBinding) => void;
  onCancel: () => void;
}

function ShortcutRow({ id, label, binding, isRecording, onStartRecording, onRecord, onCancel }: ShortcutRowProps) {
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isRecording) return;

    function handleKeyDown(e: KeyboardEvent) {
      e.preventDefault();
      e.stopPropagation();

      // Ignore lone modifier keys
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

      if (e.key === 'Escape') {
        onCancel();
        return;
      }

      // Require at least one modifier
      if (!e.ctrlKey && !e.metaKey && !e.altKey) return;

      const newBinding: ShortcutBinding = {
        key: e.key.toLowerCase(),
        ...(e.ctrlKey || e.metaKey ? { ctrl: true } : {}),
        ...(e.altKey ? { alt: true } : {}),
        ...(e.shiftKey ? { shift: true } : {}),
      };

      onRecord(id, newBinding);
    }

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isRecording, id, onRecord, onCancel]);

  return (
    <div className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-muted/50">
      <span className="text-sm">{label}</span>
      <button
        ref={btnRef}
        type="button"
        onClick={onStartRecording}
        className={`inline-flex items-center rounded border px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          isRecording
            ? 'border-primary bg-primary/10 text-primary animate-pulse'
            : 'border-border bg-muted text-muted-foreground hover:border-primary/40'
        }`}
        aria-label={isRecording ? `Press new shortcut for ${label}` : `Change shortcut for ${label}`}
      >
        {isRecording ? 'Press keys...' : formatBinding(binding)}
      </button>
    </div>
  );
}

// ─── Formatting ────────────────────────────────────────────────────────────────

export function formatBinding(binding: ShortcutBinding): string {
  const parts: string[] = [];
  if (binding.ctrl) parts.push('Ctrl');
  if (binding.alt) parts.push('Alt');
  if (binding.shift) parts.push('Shift');
  parts.push(binding.key.length === 1 ? binding.key.toUpperCase() : capitalize(binding.key));
  return parts.join('+');
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
