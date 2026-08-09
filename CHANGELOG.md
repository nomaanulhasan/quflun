# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - Keyboard Shortcuts & Command Palette

### Added

- Command palette (Ctrl+K) — fuzzy search entries and quick actions from anywhere
- Alt+N — navigate directly to new password entry form
- Alt+Shift+N — navigate directly to new secure note form
- Ctrl+L — lock vault instantly
- Arrow key navigation in vault entry grid (↑↓←→, Home, End)
- Enter to open selected entry from keyboard navigation
- Space to copy password of selected entry
- Keyboard shortcut hints displayed in command palette actions
- Configurable shortcut bindings in Settings → Keyboard Shortcuts
- Click-to-record interface for remapping shortcuts, with reset-to-defaults
- `useHotkeys` hook for declarative global keyboard shortcut registration
- `fuzzyFilter` / `fuzzyScore` utilities for lightweight fuzzy matching
- Command palette shows entries, actions, and navigation grouped by section
- "Add First Entry" button shown when vault is empty
- Branded loading spinner (`LoadingSpinner` component) with shield icon

### Fixed

- Flash of vault selection screen during unlock transition
- Toast text unreadable in light theme (description color too faint)
- `useHotkeys` crash on IME/dead-key events where `e.key` is undefined
- Ctrl+N / Ctrl+Shift+N replaced with Alt+N / Alt+Shift+N to avoid browser conflicts

### Changed

- Shell split into focused subcomponents (sidebar, mobile-header, nav-config, use-shell-shortcuts)
- Command palette split into types, use-palette-items hook, and memo'd PaletteItemRow
- Vault list keyboard handler uses refs for stable callback (zero re-creation)
- `useHotkeys` registers listener once via ref (no re-attach on shortcut changes)

## [1.4.0] - Custom Fields & Attachments

### Added

- Custom key-value fields on entries (API keys, recovery codes, license keys, SSH keys)
- Field type: plain text or secret (masked with ProtectedValue, show/hide toggle)
- File attachments stored in KDBX binary pool (encrypted at rest, max 10 MB each)
- Attach, download, and remove attachments from the edit entry form
- Custom fields editor: add/remove fields, toggle secret mode, inline editing
- `setCustomFields()`, `addAttachment()`, `removeAttachment()`, `getAttachment()` on VaultEngine
- `CustomField` and `AttachmentMeta` types
- Custom fields included in `EntryInput` for create/edit operations
- Idle auto-lock wired into Shell (was previously built but never connected)
- Vault locks → redirects to home page (lock screen)

### Changed

- `VaultEntry` type extended with `customFields` and `attachments` arrays
- `mapKdbxEntryToVaultEntry` now extracts non-standard KDBX fields and binary metadata
- Edit entry form includes custom fields editor and attachments editor sections

## [1.3.0] - Vault Health

### Added

- Vault Health page (`/password-health`) with overall health score (0–100)
- Detects weak passwords, reused passwords, old passwords (90+ days)
- Detects missing URLs, missing usernames
- Clickable summary metrics that filter the issues list
- Issues list with drill-down to affected entries
- Vault Integrity check merged into the same page (was separate `/health-check`)
- `getPasswordHealthReport()` method on VaultEngine
- `PasswordHealthReport`, `PasswordHealthSummary`, `PasswordHealthIssue` types
- Health score algorithm (0–100) with weighted penalties per issue type

### Changed

- Merged `/health-check` into `/password-health` as "Vault Integrity" tab (old route redirects)
- Sidebar: single "Vault Health" link replaces two separate links
- Page widths: info pages use `max-w-3xl`, settings uses `max-w-4xl` with 2-column grid, tools use `max-w-2xl`
- Settings page uses 2-column layout on desktop to reduce scrolling
- Vault Health page uses tabbed format (Credential Health / Vault Integrity)
- About Settings: removed stale hardcoded values, now shows version, build date, crypto info dynamically
- Added `NEXT_PUBLIC_BUILD_DATE` env variable (generated at build time)

### Fixed

- Tests updated: `ImportSummary` tests now include required `total` field
- About Settings tests updated to match new dynamic content

## [1.2.2] - UI/UX Improvements + Code Optimization

### Changed

- Entry card redesigned: colored initials avatar, title/username top section, actions + strength badge bottom
- Secure note cards show "Updated X ago" relative date in subtitle
- "New Entry" dashed card added at end of grid (replaces top "+ Add" button)
- 4-column grid layout on xl screens (1280px+)
- Extracted inline components into own files: `VaultListView`, `EntryEditorWrapper`, `ImportSection`, `ExportSection`
- Password strength badge on cards (Weak / Fair / Strong) computed by VaultEngine
- Documentation fully synced with codebase through v1.2.2

## [1.2.1] - Accessibility & Interaction Improvements

### Changed

- Favorite star on entry cards now toggleable without opening the entry
- Touch targets standardized to 36×36px (exceeds WCAG 2.5.8 Level AA 24px minimum)
- Icon size standardized to 16px (IBM Design Language recommendation for toolbar icons)
- Native `title` tooltips added on all icon buttons (desktop hover)

## [1.2.0] - Quick Copy Actions

### Added

- Quick copy buttons on entry cards: copy username, copy password, copy URL, open website
- Quick copy buttons on edit entry form: username, password, URL fields
- `useCopyAction` hook: shared clipboard copy with toast feedback and 2s visual state
- `CopyButton` reusable component (clipboard → check icon transition)
- `CopyAction` and `OpenLinkAction` field action components
- Kiro steering rule: Security Review required for every new feature

### Security

- Passwords fetched on-demand from engine only at copy-click time (not stored in card state)
- All clipboard operations go through ClipboardManager (ownership tracking, auto-clear)
- No favicon fetching — preserves offline-first model and prevents privacy leakage
- No new external requests, no CSP changes, no new dependencies

## [1.1.0] - Change Vault Password

### Added

- Change Password feature in Settings — users can update their vault master password
- Safe password change with 5-step process: verify current → update credentials → re-encrypt → integrity check → persist
- Rollback safety: old credentials and encrypted blob preserved on any failure
- Weak password warning in change password form (below 8 characters)
- `changePassword` method on VaultEngine interface
- `changePassword` action on VaultStore
- `ChangePassword` settings card component (only visible when vault is unlocked)
- `trailingSlash: true` in Next.js config to eliminate redirect chains on Vercel

### Changed

- Version bumped to 1.1.0
- Settings page now shows "Change Password" card between Security and Backup sections

### Fixed

- Vercel redirect chain (same-URL redirect) costing 600ms desktop / 2750ms mobile — resolved by explicit `trailingSlash: true`

## [1.0.2] - CSP Moved to HTTP Headers

### Changed

- CSP is now delivered exclusively via HTTP headers (`vercel.json` + `public/_headers`) instead of a `<meta>` tag
- Removed `extract-csp-hashes.mjs` from build pipeline (no longer needed — CSP uses `'unsafe-inline'`)
- Build pipeline simplified to: `next build --webpack && serwist build`
- Added `'unsafe-inline'` to `script-src` — required because Next.js static export generates inline scripts with build-specific content that can't be pre-hashed in CI
- Added `vercel.json` for Vercel deployment with full security headers

### Fixed

- Inline scripts no longer blocked on Vercel deployment
- Removed dead code path in `extract-csp-hashes.mjs` (script still exists for reference but removed from build)

## [1.0.1] - CSP and PWA Dev-Mode Fixes

### Fixed

- CSP meta tag removed from layout — caused CSP violations in both dev and production
- Service worker registration skipped in development to prevent stale precache manifest 404 errors
- Stale service workers from previous builds are automatically unregistered in dev mode
- Changed `style-src` from `'unsafe-hashes'` to `'unsafe-inline'` — Shadcn/Radix components apply inline styles dynamically at runtime which cannot be pre-hashed

### Changed

- CSP enforcement moved from meta tag to HTTP headers (`vercel.json`, `_headers`)

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
