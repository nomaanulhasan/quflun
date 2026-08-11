'use client';

import { ShieldAlert, RefreshCw, Clock, Globe, User } from 'lucide-react';
import type { PasswordHealthSummary } from '@/lib/vault-engine';

interface HealthSummaryProps {
  summary: PasswordHealthSummary;
  onFilter: (filter: string) => void;
}

/**
 * Summary stats grid for the password health dashboard.
 */
export function HealthSummary({ summary, onFilter }: HealthSummaryProps) {
  const metrics = [
    {
      key: 'weak',
      label: 'Weak',
      value: summary.weakPasswords,
      icon: ShieldAlert,
      color: 'text-red-500',
    },
    {
      key: 'reused',
      label: 'Reused',
      value: summary.reusedPasswords,
      icon: RefreshCw,
      color: 'text-orange-500',
    },
    {
      key: 'old',
      label: 'Old (90+ days)',
      value: summary.oldPasswords,
      icon: Clock,
      color: 'text-amber-500',
    },
    {
      key: 'missing-url',
      label: 'No URL',
      value: summary.missingUrls,
      icon: Globe,
      color: 'text-blue-500',
    },
    {
      key: 'missing-username',
      label: 'No Username',
      value: summary.missingUsernames,
      icon: User,
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {metrics.map(({ key, label, value, icon: Icon, color }) => (
        <button
          key={key}
          type="button"
          onClick={() => value > 0 && onFilter(key)}
          disabled={value === 0}
          className="border-border bg-card hover:bg-accent/50 focus-visible:ring-ring flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-default disabled:opacity-50"
          title={
            value > 0 ? `Show ${label.toLowerCase()} entries` : `No ${label.toLowerCase()} entries`
          }
        >
          <Icon
            className={`h-4 w-4 ${value > 0 ? color : 'text-muted-foreground'}`}
            aria-hidden="true"
          />
          <span className="text-lg leading-none font-semibold">{value}</span>
          <span className="text-muted-foreground text-[10px] leading-tight">{label}</span>
        </button>
      ))}
    </div>
  );
}
