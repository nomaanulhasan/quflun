interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

/**
 * Standard page header with title and optional subtitle.
 */
export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-semibold">{title}</h1>
      {subtitle && (
        <span className="text-sm text-muted-foreground">{subtitle}</span>
      )}
    </div>
  );
}
