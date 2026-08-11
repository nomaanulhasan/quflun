'use client';

import { useState, useCallback } from 'react';
import { Wand2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { GeneratorOptions } from './generator-options';
import { passwordGenerator } from '@/lib/password-generator';
import type { PasswordGeneratorConfig } from '@/lib/password-generator';

interface GeneratorDialogProps {
  onInsert: (password: string) => void;
}

/**
 * Inline password generator dialog — opened from password fields.
 */
export function GeneratorDialog({ onInsert }: GeneratorDialogProps) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<PasswordGeneratorConfig>(
    passwordGenerator.getDefaultConfig()
  );
  const [generated, setGenerated] = useState('');

  const generate = useCallback(() => {
    const validation = passwordGenerator.validate(config);
    if (validation.valid) {
      setGenerated(passwordGenerator.generate(config));
    }
  }, [config]);

  function handleOpen() {
    setGenerated(passwordGenerator.generate(config));
  }

  function handleInsert() {
    onInsert(generated);
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) handleOpen();
      }}
    >
      <DialogTrigger
        render={<Button type="button" variant="ghost" size="icon" aria-label="Generate password" />}
      >
        <Wand2 className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="max-w-sm p-6">
        <DialogTitle className="text-base font-semibold">Generate Password</DialogTitle>
        <DialogDescription className="text-muted-foreground text-sm">
          Configure and generate a strong password.
        </DialogDescription>

        <div className="mt-4 space-y-4">
          {/* Preview */}
          <div className="border-border bg-muted/50 rounded-md border p-3">
            <code className="font-mono text-sm break-all">{generated || '...'}</code>
          </div>

          <GeneratorOptions config={config} onChange={setConfig} />

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generate}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleInsert}
              disabled={!generated}
              className="ml-auto"
            >
              Use Password
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
