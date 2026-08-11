import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

/**
 * Standard page header with title and optional subtitle.
 */
export function PageHeader({ title, subtitle, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <h1 className="text-xl font-semibold">{title}</h1>
      {subtitle && <span className="text-muted-foreground text-sm">{subtitle}</span>}
    </div>
  );
}
