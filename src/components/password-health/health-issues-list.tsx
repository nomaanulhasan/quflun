'use client';

import { ShieldAlert, RefreshCw, Clock, Globe, User } from 'lucide-react';
import type { PasswordHealthIssue, PasswordIssueType } from '@/lib/vault-engine';

interface HealthIssuesListProps {
  issues: PasswordHealthIssue[];
  filter: string | null;
  onClearFilter: () => void;
  onOpenEntry: (uuid: string) => void;
}

const issueConfig: Record<
  PasswordIssueType,
  { icon: typeof ShieldAlert; label: string; color: string }
> = {
  weak: { icon: ShieldAlert, label: 'Weak password', color: 'text-red-500' },
  reused: { icon: RefreshCw, label: 'Reused password', color: 'text-orange-500' },
  old: { icon: Clock, label: 'Old password', color: 'text-amber-500' },
  'missing-url': { icon: Globe, label: 'Missing URL', color: 'text-blue-500' },
  'missing-username': { icon: User, label: 'Missing username', color: 'text-purple-500' },
  'no-category': { icon: User, label: 'No category', color: 'text-slate-500' },
};

/**
 * Filterable list of password health issues.
 */
export function HealthIssuesList({
  issues,
  filter,
  onClearFilter,
  onOpenEntry,
}: HealthIssuesListProps) {
  const filtered = filter ? issues.filter((i) => i.issue === filter) : issues;
  const filterLabel = filter ? issueConfig[filter as PasswordIssueType]?.label : null;

  if (filtered.length === 0) {
    return (
      <div className="border-border bg-card rounded-lg border p-6 text-center">
        <p className="text-sm font-medium text-green-600">No issues found</p>
        <p className="text-muted-foreground mt-1 text-xs">All your entries look great.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filter && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs font-medium">
            Showing: {filterLabel} ({filtered.length})
          </p>
          <button
            type="button"
            onClick={onClearFilter}
            className="text-primary focus-visible:ring-ring rounded text-xs hover:underline focus-visible:ring-2 focus-visible:outline-none"
          >
            Show all
          </button>
        </div>
      )}
      <div className="max-h-80 space-y-1.5 overflow-y-auto">
        {filtered.map((issue, idx) => {
          const { icon: Icon, label, color } = issueConfig[issue.issue];
          return (
            <button
              key={`${issue.uuid}-${issue.issue}-${idx}`}
              type="button"
              onClick={() => onOpenEntry(issue.uuid)}
              className="border-border bg-card hover:bg-accent/50 focus-visible:ring-ring flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
              title={`Open "${issue.title}" to fix this issue`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${color}`} aria-hidden="true" />
              <span className="text-foreground flex-1 truncate text-sm">{issue.title}</span>
              <span className="text-muted-foreground shrink-0 text-[10px]">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
