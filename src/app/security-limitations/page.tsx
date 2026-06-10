import { Shell } from '@/components/layout/shell';
import { PageHeader } from '@/components/common/page-header';

export default function SecurityLimitationsPage() {
  return (
    <Shell>
      <div className="mx-auto w-full max-w-lg space-y-6">
        <PageHeader title="Security Limitations" subtitle="Known constraints of browser-based password management." />

        <Section title="Browser Extensions">
          Browser extensions with DOM access can potentially read page content, including form fields and displayed passwords.
          Qufly cannot prevent a malicious extension from inspecting the page. Use trusted extensions only.
        </Section>

        <Section title="Malware">
          If your device is compromised by malware with keylogging or memory inspection capabilities, Qufly cannot protect your data.
          Keep your operating system and browser updated.
        </Section>

        <Section title="JavaScript Memory">
          JavaScript does not provide deterministic memory erasure (no equivalent to C's memset).
          When the vault is locked, all references are nulled and released for garbage collection, but the runtime decides when memory is actually reclaimed.
        </Section>

        <Section title="Clipboard Clearing">
          Clipboard auto-clear is best-effort. On Chromium browsers, Qufly verifies ownership before clearing.
          On Firefox and Safari, clipboard read access is restricted — Qufly clears unconditionally on timeout, which may overwrite external clipboard content.
        </Section>

        <Section title="DevTools Inspection">
          A user with DevTools open can inspect JavaScript variables, including decrypted vault contents while unlocked.
          This is inherent to all browser-based applications and is not unique to Qufly.
        </Section>

        <Section title="Recommended Mitigations">
          Lock your vault when stepping away. Use a strong master password (12+ characters recommended).
          Keep your browser and OS updated. Avoid installing untrusted browser extensions.
          Export backups regularly and store them in a secure location.
        </Section>
      </div>
    </Shell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}
