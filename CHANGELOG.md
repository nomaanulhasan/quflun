# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- Utility pages (settings, import/export UI, health check UI, security docs)
- PWA setup with Serwist service worker
- CSP hardening and post-build hash extraction
- Security headers configuration

## [1.0.0] - Foundation Complete

### Added

- Core vault engine with KDBX 4.x format support via kdbxweb
- Vault lifecycle: create, open, lock, unlock, save with Argon2id KDF
- Brute-force protection: incremental delay, 60-second cooldown after 5 failures
- Entry CRUD: add, edit, delete password entries with full field validation
- Secure notes: stored as standard KDBX entries with type marker in customData
- Categories implemented as native KDBX groups (not metadata strings)
- Tags with registry management and cascade deletion
- Favorites via KDBX customData
- In-memory substring search engine with case-insensitive matching
- Cryptographically secure password generator with rejection sampling and Fisher-Yates shuffle
- Clipboard manager with ownership verification and timed auto-clear
- Idle monitor with configurable timeout (1–60 minutes)
- KDBX import with UUID deduplication and metadata preservation
- KDBX export producing valid KDBX 4.x files
- CSV import/export via PapaParse (RFC 4180 compliant)
- Vault health check: group hierarchy, UUID uniqueness, serialization verification
- Zustand stores: vault store (no persist middleware), UI store (manual IndexedDB persistence)
- React hooks: useVault, useSearch, useIdle, useClipboard
- Lock screen with password visibility toggle and brute-force state display
- Vault selection: create new vault, open KDBX file
- Responsive shell with grouped sidebar navigation (Lucide icons)
- Entry list with search bar, favorites filter, category filter, tag filter chips
- New entry form with inline password generator dialog
- New secure note form
- Entry edit/delete with Shadcn delete confirmation dialog
- Chip-style tags input with Enter/Tab to add, Backspace to delete, blur auto-commit
- Shared components: PasswordField, FormActions, FormError, FilePicker, EmptyState, PageHeader, VersionBadge, TagFilter, CategoryFilter, FavoriteToggle, TagsInput, GeneratorDialog
- Vault metadata persistence in IndexedDB (survives page reload, shows lock screen)
- Custom 404 page (does not render vault selection)
- Static export with webpack (argon2-browser WASM served as asset)
- 295 property-based and unit tests via vitest + fast-check
- Geist fonts via `geist` package (no Google Fonts CDN dependency)
- pnpm overrides for @xmldom/xmldom security fix
- Tailwind CSS v4 with Shadcn UI (base-nova style, Base UI primitives)

### Security

- No localStorage or sessionStorage for vault data
- No persist middleware on vault store
- Decrypted vault exists only in memory — cleared on lock
- Master password never stored or persisted
- Argon2id with 64 MB memory, 2 iterations, 1 parallelism
- ProtectedValue (XOR-encoded) for passwords in memory
- Content Security Policy meta tag placeholder with post-build hash extraction planned
- Referrer-Policy: no-referrer meta tag
- No telemetry, analytics, or external network requests
- All fonts and assets self-hosted
