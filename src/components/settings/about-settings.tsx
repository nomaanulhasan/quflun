import Link from 'next/link';
import { SettingsCard } from './settings-card';

export function AboutSettings() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0';

  return (
    <SettingsCard title="About">
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Application</span>
          <span className="font-medium">Qufly</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Version</span>
          <span className="font-mono text-xs">{version}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Milestone</span>
          <span className="text-xs">v1-foundation-complete</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tests</span>
          <span className="text-xs">295 passing</span>
        </div>

        <div className="border-t border-border pt-3 space-y-1">
          <p className="text-xs text-muted-foreground">Private by design • Offline-first • Local-only</p>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <InfoLink href="/security" label="Security" />
          <InfoLink href="/privacy" label="Privacy" />
          <InfoLink href="/security-limitations" label="Limitations" />
          <InfoLink href="https://github.com" label="Repository" external />
        </div>
      </div>
    </SettingsCard>
  );
}

function InfoLink({ href, label, external = false }: { href: string; label: string; external?: boolean }) {
  const classes = "text-xs text-primary underline-offset-2 hover:underline";
  if (external) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>{label}</a>;
  }
  return <Link href={href} className={classes}>{label}</Link>;
}
