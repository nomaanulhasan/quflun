import { cn } from '@/lib/utils';

interface StatCardProps {
  value: number | string;
  label: string;
  className?: string;
}

/**
 * Reusable stat card — displays a numeric value with a label.
 * Used in health dashboards and summary grids.
 */
function StatCard({ value, label, className }: StatCardProps) {
  return (
    <div className={cn('bg-muted/50 rounded-lg p-2.5 text-center', className)}>
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}

export { StatCard };
