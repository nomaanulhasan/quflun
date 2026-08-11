'use client';

interface HealthScoreProps {
  score: number;
}

/**
 * Circular score indicator for the password health dashboard.
 */
export function HealthScore({ score }: HealthScoreProps) {
  const color = score >= 80 ? 'text-green-500' : score >= 50 ? 'text-amber-500' : 'text-red-500';
  const bgColor =
    score >= 80 ? 'bg-green-500/10' : score >= 50 ? 'bg-amber-500/10' : 'bg-red-500/10';
  const label = score >= 80 ? 'Good' : score >= 50 ? 'Needs Attention' : 'At Risk';

  return (
    <div className={`flex flex-col items-center gap-2 rounded-xl p-6 ${bgColor}`}>
      <div className={`text-4xl font-bold ${color}`}>{score}</div>
      <div className="text-foreground text-sm font-medium">Health Score</div>
      <div className={`text-xs font-medium ${color}`}>{label}</div>
    </div>
  );
}
