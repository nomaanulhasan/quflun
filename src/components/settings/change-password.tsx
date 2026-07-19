'use client';

import { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PasswordField } from '@/components/forms/password-field';
import { SettingsCard } from './settings-card';
import { useVaultStore } from '@/components/providers';
import { MASTER_PASSWORD_MIN_LENGTH, MASTER_PASSWORD_MAX_LENGTH, MASTER_PASSWORD_WEAK_THRESHOLD } from '@/lib/constants';

export function ChangePassword() {
  const status = useVaultStore((s) => s.status);
  const changePassword = useVaultStore((s) => s.changePassword);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Only show when vault is unlocked
  if (status !== 'unlocked') return null;

  const newPasswordTooShort = newPassword.length > 0 && newPassword.length < MASTER_PASSWORD_MIN_LENGTH;
  const newPasswordTooLong = newPassword.length > MASTER_PASSWORD_MAX_LENGTH;
  const newPasswordWeak = newPassword.length > 0 && newPassword.length < MASTER_PASSWORD_WEAK_THRESHOLD;
  const passwordsMatch = confirmPassword.length === 0 || newPassword === confirmPassword;
  const canSubmit =
    currentPassword.length >= MASTER_PASSWORD_MIN_LENGTH &&
    newPassword.length >= MASTER_PASSWORD_MIN_LENGTH &&
    newPassword.length <= MASTER_PASSWORD_MAX_LENGTH &&
    newPassword === confirmPassword &&
    !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SettingsCard title="Change Password" description="Update your vault master password. All data remains intact.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordField
          id="current-password"
          label="Current password"
          value={currentPassword}
          onChange={(v) => { setCurrentPassword(v); setError(null); setSuccess(false); }}
          placeholder="Enter current password"
          disabled={loading}
          required
        />

        <PasswordField
          id="new-password"
          label="New password"
          value={newPassword}
          onChange={(v) => { setNewPassword(v); setError(null); setSuccess(false); }}
          placeholder="Enter new password"
          disabled={loading}
          error={
            newPasswordTooShort ? 'Password is too short.' :
            newPasswordTooLong ? `Maximum ${MASTER_PASSWORD_MAX_LENGTH} characters.` :
            undefined
          }
          required
        />

        {newPasswordWeak && !newPasswordTooShort && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            Weak password — consider using at least {MASTER_PASSWORD_WEAK_THRESHOLD} characters.
          </p>
        )}

        <PasswordField
          id="confirm-password"
          label="Confirm new password"
          value={confirmPassword}
          onChange={(v) => { setConfirmPassword(v); setError(null); setSuccess(false); }}
          placeholder="Re-enter new password"
          disabled={loading}
          error={!passwordsMatch ? 'Passwords do not match.' : undefined}
          required
        />

        {error && (
          <p className="text-sm text-destructive" role="alert">{error}</p>
        )}

        {success && (
          <p className="text-sm text-green-600 dark:text-green-400" role="status">
            Password changed successfully.
          </p>
        )}

        <Button type="submit" disabled={!canSubmit} size="sm" className="gap-1.5">
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Changing...
            </>
          ) : (
            <>
              <KeyRound className="h-3.5 w-3.5" />
              Change Password
            </>
          )}
        </Button>
      </form>
    </SettingsCard>
  );
}
