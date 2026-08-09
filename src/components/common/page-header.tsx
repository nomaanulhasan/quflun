import { cn } from "@/lib/utils";

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
    <div className={cn("flex items-center gap-4 justify-between", className)}>
      <h1 className="text-xl font-semibold">{title}</h1>
      {subtitle && (
        <span className="text-sm text-muted-foreground">{subtitle}</span>
      )}
    </div>
  );
}
