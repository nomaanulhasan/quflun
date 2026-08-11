'use client';

import { useRef } from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FilePickerProps {
  id: string;
  accept: string;
  fileName: string;
  disabled?: boolean;
  onFileSelected: (file: ArrayBuffer, name: string) => void;
  onError?: (message: string) => void;
}

/**
 * File picker with visual feedback for selected file name.
 */
export function FilePicker({
  id,
  accept,
  fileName,
  disabled = false,
  onFileSelected,
  onError,
}: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target as HTMLInputElement;
    const selected = input.files?.[0];
    if (!selected) return;

    const reader = new FileReader();
    reader.onload = () => onFileSelected(reader.result as ArrayBuffer, selected.name);
    reader.onerror = () => onError?.('Failed to read file.');
    reader.readAsArrayBuffer(selected);
  }

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        className="shrink-0"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        <FolderOpen className="mr-2 h-4 w-4" />
        {fileName ? 'Change' : 'Choose File'}
      </Button>
      <span
        className={`flex items-center truncate text-sm ${
          fileName ? 'text-foreground font-medium' : 'text-muted-foreground'
        }`}
      >
        {fileName || 'No file selected'}
      </span>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
