import { Shell } from '@/components/layout/shell';
import { PageHeader } from '@/components/common/page-header';

export default function PrivacyPage() {
  return (
    <Shell>
      <div className="mx-auto w-full space-y-6">
        <PageHeader title="Privacy" subtitle="Your data stays on your device." className='xl:justify-start' />

        <Section title="No Data Collection">
          Quflun does not collect, transmit, or share any user data with third parties.
          There are no analytics, telemetry, tracking scripts, or advertising frameworks in the application.
        </Section>

        <Section title="Local-Only Storage">
          All vault data is stored exclusively on your device using IndexedDB.
          Encrypted vault files never leave your browser — there is no server, no cloud sync, and no remote backup.
        </Section>

        <Section title="No Accounts">
          Quflun does not require or offer user account creation.
          There is no registration, no email collection, and no authentication server.
        </Section>

        <Section title="No External Resources">
          All application resources (scripts, stylesheets, fonts, icons) are bundled locally.
          Quflun does not load assets from CDNs, Google Fonts, or any third-party domain at runtime.
        </Section>

        <Section title="Open Source">
          The source code is available for inspection.
          You can verify these claims independently by reviewing the codebase and its dependency tree.
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
