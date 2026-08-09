'use client';

import { ShieldAlert, RefreshCw, Clock, Globe, User } from 'lucide-react';
import type { PasswordHealthIssue, PasswordIssueType } from '@/lib/vault-engine';

interface HealthIssuesListProps {
  issues: PasswordHealthIssue[];
  filter: string | null;
  onClearFilter: () => void;
  onOpenEntry: (uuid: string) => void;
}

const issueConfig: Record<PasswordIssueType, { icon: typeof ShieldAlert; label: string; color: string }> = {
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
export function HealthIssuesList({ issues, filter, onClearFilter, onOpenEntry }: HealthIssuesListProps) {
  const filtered = filter ? issues.filter((i) => i.issue === filter) : issues;
  const filterLabel = filter ? issueConfig[filter as PasswordIssueType]?.label : null;

  if (filtered.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-sm text-green-600 font-medium">No issues found</p>
        <p className="text-xs text-muted-foreground mt-1">All your entries look great.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filter && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">
            Showing: {filterLabel} ({filtered.length})
          </p>
          <button
            type="button"
            onClick={onClearFilter}
            className="text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Show all
          </button>
        </div>
      )}
      <div className="space-y-1.5 max-h-80 overflow-y-auto">
        {filtered.map((issue, idx) => {
          const { icon: Icon, label, color } = issueConfig[issue.issue];
          return (
            <button
              key={`${issue.uuid}-${issue.issue}-${idx}`}
              type="button"
              onClick={() => onOpenEntry(issue.uuid)}
              className="flex w-full items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title={`Open "${issue.title}" to fix this issue`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${color}`} aria-hidden="true" />
              <span className="flex-1 truncate text-sm text-foreground">{issue.title}</span>
              <span className="shrink-0 text-[10px] text-muted-foreground">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
