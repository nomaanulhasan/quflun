'use client';

import { useRef } from 'react';
import { Paperclip, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AttachmentMeta } from '@/types';

interface AttachmentsEditorProps {
  attachments: AttachmentMeta[];
  entryUuid: string;
  onAdd: (filename: string, data: ArrayBuffer) => Promise<void>;
  onRemove: (filename: string) => Promise<void>;
  onDownload: (filename: string) => void;
  disabled?: boolean;
}

/**
 * Editor for file attachments on entries.
 * Files are stored in the KDBX binary pool (encrypted at rest).
 */
export function AttachmentsEditor({
  attachments,
  entryUuid: _entryUuid,
  onAdd,
  onRemove,
  onDownload,
  disabled = false,
}: AttachmentsEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    await onAdd(file.name, buffer);

    // Reset input so the same file can be re-selected
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Attachments</label>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          className="gap-1"
        >
          <Paperclip className="h-3 w-3" aria-hidden="true" />
          Attach File
        </Button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          aria-label="Choose file to attach"
        />
      </div>

      {attachments.length === 0 && (
        <p className="text-muted-foreground text-xs">
          No attachments. Attach SSH keys, certificates, or documents (max 10 MB each).
        </p>
      )}

      {attachments.map((att) => (
        <div
          key={att.key}
          className="border-border flex items-center gap-2 rounded-md border px-3 py-2"
        >
          <Paperclip className="text-muted-foreground h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="flex-1 truncate text-xs">{att.key}</span>
          <span className="text-muted-foreground shrink-0 text-[10px]">{formatSize(att.size)}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Download"
            aria-label={`Download ${att.key}`}
            onClick={() => onDownload(att.key)}
            disabled={disabled}
          >
            <Download className="h-3 w-3" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Remove"
            aria-label={`Remove ${att.key}`}
            onClick={() => onRemove(att.key)}
            disabled={disabled}
          >
            <Trash2 className="text-destructive h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
