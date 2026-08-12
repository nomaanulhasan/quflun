import { H2, Small } from '@/components/ui/typography';

interface SettingsCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function SettingsCard({ title, description, children }: SettingsCardProps) {
  return (
    <div className="border-border bg-card space-y-4 rounded-lg border p-5">
      <div>
        <H2 className="text-sm">{title}</H2>
        {description && <Small className="mt-0.5">{description}</Small>}
      </div>
      {children}
    </div>
  );
}
