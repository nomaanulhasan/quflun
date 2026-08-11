'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { Small } from '@/components/ui/typography';
import { FieldRenderer, type FieldConfig } from '@/components/forms/form-renderer';
import { SettingsCard } from './settings-card';
import { useVaultStore } from '@/components/providers';
import { changePasswordSchema, type ChangePasswordFormData } from '@/lib/validators/entry-schemas';
import { MASTER_PASSWORD_WEAK_THRESHOLD } from '@/lib/constants';

const FIELDS: FieldConfig[] = [
  {
    name: 'currentPassword',
    type: 'password',
    label: 'Current password',
    required: true,
    placeholder: 'Enter current password',
  },
  {
    name: 'newPassword',
    type: 'password',
    label: 'New password',
    required: true,
    placeholder: 'Enter new password',
  },
  {
    name: 'confirmPassword',
    type: 'password',
    label: 'Confirm new password',
    required: true,
    placeholder: 'Re-enter new password',
  },
];

export function ChangePassword() {
  const status = useVaultStore((s) => s.status);
  const changePassword = useVaultStore((s) => s.changePassword);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  if (status !== 'unlocked') return null;

  const newPassword = watch('newPassword');
  const isWeak =
    newPassword.length > 0 &&
    newPassword.length < MASTER_PASSWORD_WEAK_THRESHOLD &&
    !errors.newPassword;

  async function onSubmit(data: ChangePasswordFormData) {
    setSubmitError(null);
    setSuccess(false);
    try {
      await changePassword(data.currentPassword, data.newPassword);
      setSuccess(true);
      reset();
    } catch (err) {
      setSubmitError((err as Error).message);
    }
  }

  return (
    <SettingsCard
      title="Change Password"
      description="Update your vault master password. All data remains intact."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FieldRenderer
          fields={FIELDS}
          watch={watch}
          setValue={setValue}
          errors={errors}
          disabled={isSubmitting}
        />
        {isWeak && (
          <Small className="text-yellow-600 dark:text-yellow-400">
            Weak password — consider using at least {MASTER_PASSWORD_WEAK_THRESHOLD} characters.
          </Small>
        )}
        <FormError message={submitError} />
        {success && (
          <Small className="text-green-600 dark:text-green-400" role="status">
            Password changed successfully.
          </Small>
        )}
        <Button type="submit" disabled={isSubmitting} size="sm" className="gap-1.5">
          {isSubmitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Changing...
            </>
          ) : (
            <>
              <KeyRound className="h-3.5 w-3.5" /> Change Password
            </>
          )}
        </Button>
      </form>
    </SettingsCard>
  );
}
