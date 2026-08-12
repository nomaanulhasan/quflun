import { cn } from '@/lib/utils';
import { H1, Span } from '@/components/ui/typography';

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
      <H1>{title}</H1>
      {subtitle && <Span className="text-muted-foreground">{subtitle}</Span>}
    </div>
  );
}
