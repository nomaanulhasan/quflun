'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle } from 'lucide-react';
import { H1, Muted, Small } from '@/components/ui/typography';
import { FormError } from '@/components/ui/form-error';
import { FormActions } from '@/components/forms/form-actions';
import { FieldRenderer, type FieldConfig } from '@/components/forms/form-renderer';
import { useVaultStore } from '@/components/providers';
import { createVaultSchema, type CreateVaultFormData } from '@/lib/validators/entry-schemas';
import { MASTER_PASSWORD_WEAK_THRESHOLD } from '@/lib/constants';
import { toast } from 'sonner';

interface CreateVaultFormProps {
  onBack: () => void;
}

const FIELDS: FieldConfig[] = [
  { name: 'name', label: 'Vault Name', required: true, placeholder: 'My Vault', autoFocus: true },
  {
    name: 'password',
    type: 'password',
    label: 'Master Password',
    required: true,
    placeholder: 'Enter master password',
  },
  {
    name: 'confirm',
    type: 'password',
    label: 'Confirm Password',
    required: true,
    placeholder: 'Re-enter password',
  },
];

export function CreateVaultForm({ onBack }: CreateVaultFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const create = useVaultStore((s) => s.create);
  const router = useRouter();

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateVaultFormData>({
    resolver: zodResolver(createVaultSchema),
    defaultValues: { name: '', password: '', confirm: '' },
  });

  const password = watch('password');
  const isWeak =
    password.length > 0 && password.length < MASTER_PASSWORD_WEAK_THRESHOLD && !errors.password;

  async function onSubmit(data: CreateVaultFormData) {
    setSubmitError(null);
    try {
      await create(data.password, data.name.trim());
      toast.success('Vault created!', {
        description: 'Consider exporting a backup to keep your data safe.',
        duration: 6000,
      });
      router.replace('/vault');
    } catch (err) {
      setSubmitError((err as Error).message);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <H1>Create New Vault</H1>
          <Muted>Choose a strong master password.</Muted>
          <Small className="font-medium text-amber-600 dark:text-amber-500">
            ⚠ Password is never recoverable. If you forget it, your data is lost.
          </Small>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldRenderer
            fields={FIELDS}
            watch={watch}
            setValue={setValue}
            errors={errors}
            disabled={isSubmitting}
          />
          {isWeak && (
            <Small className="flex items-center gap-1 text-amber-600">
              <AlertTriangle className="h-3 w-3" />
              Weak password (less than 8 characters)
            </Small>
          )}
          <FormError message={submitError} />
          <FormActions
            submitLabel="Create Vault"
            loadingLabel="Creating..."
            loading={isSubmitting}
            disabled={!watch('password') || !watch('confirm')}
            onBack={onBack}
          />
        </form>
      </div>
    </div>
  );
}
