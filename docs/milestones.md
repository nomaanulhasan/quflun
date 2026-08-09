# Quflun Milestones

## v1-foundation-complete

Date: 2026-06-09
Status: Completed
Git tag: v1-foundation-complete

Highlights:
- Project scaffolding completed
- Adapter layer completed (CryptoAdapter, StorageAdapter)
- Vault engine completed (lifecycle, CRUD, notes, categories, tags, favorites)
- Service layer completed (search, password generator, clipboard, idle monitor)
- Import/export completed (KDBX with UUID dedup, CSV via PapaParse)
- Health check completed (group hierarchy, UUID uniqueness, serialization)
- Zustand stores and hooks completed
- Core UI completed (lock screen, vault list, entry editor, new entry/note)
- Search and filters implemented (category, tag, favorites)
- Password generator implemented (inline dialog from password fields)
- Secure notes implemented (KDBX entries with type marker)
- Shared component architecture established (PasswordField, TagsInput, FavoriteToggle, etc.)
- Static export architecture finalized (webpack + argon2 WASM asset)
- Memory-only decrypted vault model
- Navigation and reload trust issues fixed
- 295 tests passing

Next phase: v1-utility-pages

## v1-utility-pages

Status: Completed

## v1-pwa-complete

Status: Completed

## v1-beta

Status: Completed

## v1.0.0

Status: Completed

## v1.1.0

Date: 2026-07-19
Status: Completed

Highlights:
- Change vault master password feature added to Settings
- Safe 5-step password change: verify → update credentials → re-encrypt → integrity check → persist
- Full rollback safety — old credentials and encrypted blob preserved on any failure
- Weak password warning UX
- Lighthouse performance fix: `trailingSlash: true` eliminates Vercel redirect chain
- 392 tests passing across 27 test files

## v1.2.0

Date: 2026-08-09
Status: Completed

Highlights:
- Quick Copy Actions: copy username, password, URL directly from entry cards and edit forms
- useCopyAction hook with ClipboardManager singleton, toast feedback, 2s visual state
- CopyButton, CopyAction, OpenLinkAction reusable components
- Kiro steering rule: Security Review mandatory for every feature
- 392 tests passing across 27 test files

## v1.2.1

Date: 2026-08-09
Status: Completed

Highlights:
- Favorite star toggleable on entry cards without opening editor
- Touch targets standardized to 36px (WCAG 2.5.8 Level AA)
- Icon sizes standardized to 16px (IBM Design Language)
- Native title tooltips on all icon buttons for desktop
- 392 tests passing across 27 test files

## v1.2.2

Date: 2026-08-09
Status: Completed

Highlights:
- Entry card UI redesigned: colored initials avatar, structured layout, action bar
- Password strength badge on cards (Weak / Fair / Strong) computed by VaultEngine
- Secure note cards show relative update time ("Updated today", "Updated 3 days ago")
- "New Entry" dashed card CTA at end of grid (top button removed)
- 4-column grid on xl screens (1280px+)
- Code optimization: VaultListView, EntryEditorWrapper, ImportSection, ExportSection extracted
- Documentation fully synced through v1.2.2
- 392 tests passing across 27 test files

## v1.3.0

Date: 2026-08-09
Status: Completed

Highlights:
- Password Health Dashboard: health score, weak/reused/old password detection, missing fields audit
- Tabbed UI: Credential Health + Vault Integrity in one unified page
- Merged `/health-check` into `/password-health` (old route redirects)
- Responsive page widths: info pages `max-w-3xl`, settings `max-w-4xl` 2-col grid, tools `max-w-2xl`
- About Settings: dynamic version, build date, crypto info (removed stale hardcoded values)
- `NEXT_PUBLIC_BUILD_DATE` env variable added at build time
- Navigation consolidated: single "Vault Health" link in sidebar
- Tests synced with interface changes (ImportResult.total, AboutSettings)
- 391 tests passing across 27 test files
