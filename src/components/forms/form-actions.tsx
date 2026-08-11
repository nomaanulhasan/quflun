import { Button } from '@/components/ui/button';

interface FormActionsProps {
  submitLabel: string;
  loadingLabel: string;
  loading: boolean;
  disabled?: boolean;
  onBack?: () => void;
  backLabel?: string;
}

/**
 * Standard form action row with back + submit buttons.
 */
export function FormActions({
  submitLabel,
  loadingLabel,
  loading,
  disabled = false,
  onBack,
  backLabel = 'Back',
}: FormActionsProps) {
  return (
    <div className="flex gap-3">
      {onBack && (
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onBack}
          disabled={loading}
        >
          {backLabel}
        </Button>
      )}
      <Button type="submit" className="flex-1" disabled={loading || disabled}>
        {loading ? loadingLabel : submitLabel}
      </Button>
    </div>
  );
}
