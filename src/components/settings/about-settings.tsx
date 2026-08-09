import Link from 'next/link';
import { SettingsCard } from './settings-card';

export function AboutSettings() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0';
  const buildDate = process.env.NEXT_PUBLIC_BUILD_DATE ?? 'unknown';

  return (
    <SettingsCard title="About">
      <div className="space-y-3 text-sm">
        <AboutRow label="Application" value="Quflun" />
        <AboutRow label="Version" value={version} mono />
        <AboutRow label="Build" value={buildDate} mono />
        <AboutRow label="Format" value="KDBX 4.x" />
        <AboutRow label="KDF" value="Argon2id (64 MB, 2 iter)" />
        <AboutRow label="Encryption" value="AES-256 / ChaCha20" />

        <div className="border-t border-border pt-3 space-y-1">
          <p className="text-xs text-muted-foreground">Private by design • Offline-first • Local-only</p>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <InfoLink href="/security" label="Security" />
          <InfoLink href="/privacy" label="Privacy" />
          <InfoLink href="/security-limitations" label="Limitations" />
          <InfoLink href="https://github.com/nomaanulhasan/quflun" label="Repository" />
        </div>
      </div>
    </SettingsCard>
  );
}

function AboutRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono text-xs' : 'text-xs'}>{value}</span>
    </div>
  );
}

function InfoLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="text-xs text-primary underline-offset-2 hover:underline">{label}</Link>;
}
