# Quflun

Privacy-first, offline-first password manager. No accounts. No telemetry. No network requests. Your data stays on your device.

## What is Quflun?

Quflun is a Progressive Web App (PWA) that stores your passwords, secure notes, and credentials in an encrypted vault using the open KeePass KDBX 4.x format. It runs entirely in your browser — there is no backend server, no cloud sync, and no data collection.

## Features

- **KDBX 4.x format** — compatible with KeePass, KeePassXC, KeeWeb
- **Argon2id key derivation** — 64 MB memory, 2 iterations, 1 parallelism
- **AES-256 / ChaCha20 encryption** — via kdbxweb (MIT, used by KeeWeb)
- **Password entries** — title, username, password, URL, notes, tags, categories, favorites
- **Secure notes** — encrypted text stored alongside passwords
- **Password generator** — cryptographically secure, configurable length and character sets
- **Search** — case-insensitive substring matching across all fields
- **Import/Export** — KDBX and CSV (RFC 4180) formats
- **Vault health check** — structural integrity verification
- **Categories** — native KDBX groups (not metadata strings)
- **Tags** — chip-style input with registry management
- **Favorites** — quick access filtering
- **Auto-lock** — configurable idle timeout (1–60 minutes)
- **Clipboard protection** — timed auto-clear with ownership verification
- **Brute-force protection** — incremental delay + 60-second cooldown
- **Offline-first** — works without internet after initial load
- **No telemetry** — zero analytics, tracking, or external requests
- **Static export** — deployable to any static hosting (Netlify, Cloudflare Pages, S3, etc.)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, static export) |
| Language | TypeScript (strict mode) |
| UI | React 19, Tailwind CSS v4, Shadcn UI (base-nova) |
| State | Zustand 5 (no persist middleware) |
| Crypto | kdbxweb, argon2-browser (WASM) |
| Storage | IndexedDB via idb |
| Icons | Lucide React |
| Testing | Vitest, fast-check, @testing-library/react |
| Build | webpack (via Next.js), pnpm |

## Getting Started

### Prerequisites

- Node.js 18.18+
- pnpm 10+

### Install

```bash
git clone https://github.com/your-org/quflun.git
cd quflun
pnpm install
```

### Development

```bash
pnpm dev
```

Opens at `http://localhost:3000`.

### Build

```bash
pnpm build
```

This runs the full pipeline: `next build` → `serwist build` (generates service worker) → `node scripts/extract-csp-hashes.mjs` (injects CSP SHA-256 hashes into HTML).

Produces a static export in `out/` — deployable to any static hosting.

### Test

```bash
pnpm test          # Run all tests
pnpm test:watch    # Watch mode
```

## Architecture

```
Browser
├── UI Layer (React 19 + Shadcn)
├── State Layer (Zustand stores — memory only)
├── Service Layer
│   ├── Vault Engine (KDBX lifecycle + CRUD)
│   ├── Search Engine (substring matching)
│   ├── Password Generator (CSPRNG + Fisher-Yates)
│   ├── Clipboard Manager (timed clear)
│   ├── Idle Monitor (activity tracking)
│   └── Import/Export (KDBX + CSV)
├── Adapter Layer
│   ├── Crypto Adapter (kdbxweb + Argon2 WASM)
│   └── Storage Adapter (IndexedDB)
└── Platform Layer
    ├── Service Worker (Serwist 9.x, precaches all assets)
    └── Web App Manifest (installable PWA)
```

### Security Model

- Master password derives encryption key via Argon2id
- Encrypted KDBX blob stored in IndexedDB
- Decrypted vault exists **only in memory** while unlocked
- Lock clears all decrypted references (GC reclaims)
- No localStorage or sessionStorage for vault data
- No network requests for data collection
- Passwords stored as kdbxweb ProtectedValue (XOR-encoded in memory)
- Clipboard cleared after configurable timeout (30s default)

### What Quflun Does NOT Do

- Does not sync to any cloud
- Does not require an account
- Does not collect usage data
- Does not phone home
- Does not load external scripts, fonts, or assets at runtime
- Does not implement custom cryptography

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # UI components (Shadcn, forms, filters, layout, vault)
├── hooks/            # React hooks (vault, search, idle, clipboard)
├── lib/              # Business logic
│   ├── crypto/       # Crypto adapter (kdbxweb + argon2)
│   ├── storage/      # IndexedDB storage adapter
│   ├── vault-engine/ # Core KDBX operations
│   ├── search/       # Search engine
│   ├── password-generator/
│   ├── clipboard/    # Clipboard manager
│   ├── idle-monitor/ # Activity tracking
│   ├── import-export/# KDBX + CSV handlers
│   └── validators/   # Zod schemas
├── stores/           # Zustand stores
└── types/            # Shared TypeScript interfaces
tests/                # Vitest test files
```

## Security

See [SECURITY.md](./SECURITY.md) for vulnerability reporting.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## License

[MIT](./LICENSE)

## Status

**v0.7.0 — PWA & Security Hardening Complete**

Core architecture, vault engine, UI, PWA (Serwist service worker), CSP hardening (post-build hash extraction), security headers, and backup reminders are implemented. 365 tests passing across 24 test files.
