import { Shell } from '@/components/layout/shell';
import { PageHeader } from '@/components/common/page-header';

export default function SecurityPage() {
  return (
    <Shell>
      <div className="mx-auto w-full space-y-6">
        <PageHeader title="Security" subtitle="How Quflun protects your data." className='xl:justify-start' />

        <Section title="Encryption">
          Quflun encrypts your vault using AES-256 or ChaCha20 as specified by the KDBX 4.x format.
          The encryption key is derived from your master password — the encrypted vault file is unreadable without it.
        </Section>

        <Section title="Key Derivation">
          Argon2id is used as the key derivation function with parameters of 64 MB memory, 2 iterations, and 1 parallelism thread.
          This makes brute-force attacks computationally expensive, requiring significant time and resources per guess.
        </Section>

        <Section title="Vault Format">
          Quflun uses the KeePass KDBX 4.x format, an open and audited standard used by KeePass, KeePassXC, and KeeWeb.
          No custom cryptographic algorithms are implemented — all operations delegate to established, peer-reviewed libraries.
        </Section>

        <Section title="Memory Protection">
          Passwords are stored in memory using XOR-encoded ProtectedValue objects provided by the kdbxweb library.
          When the vault is locked, all decrypted references are nulled and released for garbage collection.
        </Section>

        <Section title="No Network Requests">
          Quflun makes zero network requests for data collection, analytics, or telemetry.
          All cryptographic operations run locally in your browser using WebCrypto and WebAssembly.
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
