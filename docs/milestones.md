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

- Vault Health: health score, weak/reused/old password detection, missing fields audit
- Tabbed UI: Credential Health + Vault Integrity in one unified page
- Merged `/health-check` into `/password-health` (old route redirects)
- Responsive page widths: info pages `max-w-3xl`, settings `max-w-4xl` 2-col grid, tools `max-w-2xl`
- About Settings: dynamic version, build date, crypto info (removed stale hardcoded values)
- `NEXT_PUBLIC_BUILD_DATE` env variable added at build time
- Navigation consolidated: single "Vault Health" link in sidebar
- Tests synced with interface changes (ImportResult.total, AboutSettings)
- 391 tests passing across 27 test files

## v1.4.0

Date: 2026-08-10
Status: Completed

Highlights:

- Custom key-value fields on entries (API keys, recovery codes, license keys)
- Plain text and secret (masked ProtectedValue) field types
- File attachments stored in KDBX binary pool (encrypted at rest, max 10 MB)
- Custom fields editor UI with add/remove, secret toggle, inline editing
- Attachments editor: attach, download, remove files from entries
- VaultEntry type extended with customFields and attachments
- Idle auto-lock wired into Shell (was built but never connected)
- Lock redirects user to home page
- 391 tests passing across 27 test files

## v1.5.0

Date: 2026-08-10
Status: Completed

Highlights:

- Command palette (Ctrl+K) — fuzzy search entries and quick actions from anywhere
- Configurable keyboard shortcuts (Alt+N, Alt+Shift+N, Ctrl+L) with click-to-record UI
- Arrow key navigation in vault entry grid (↑↓←→, Home, End, Enter, Space)
- `useHotkeys` hook for declarative global keyboard shortcut registration
- Shortcut hints displayed in command palette actions
- 391 tests passing across 27 test files

## v1.5.1

Date: 2026-08-10
Status: Completed

Highlights:

- Flash of vault selection/unlock transition fix
- Toast text readability in light theme fix
- Branded `LoadingSpinner` for all transitional states
- "Add First Entry" button when vault is empty
- Shell refactored into focused subcomponents
- Command palette split into types, hook, and memo'd row components
- 391 tests passing across 27 test files

## v1.5.2

Date: 2026-08-10
Status: Completed

Highlights:

- Prettier code formatter with Tailwind plugin (format on save, `pnpm format`)
- Viewport-adaptive pagination on vault entry list
- Sticky vault header with scrollable card grid
- Floating "Add Entry" button accessible at any scroll position
- Shared `NavLinks` + `LockButton` components (no duplicate code)
- Shell locked to viewport height — sidebar full-screen, only content scrolls
- Mobile UX: search button opens command palette, hidden keyboard settings
- 391 tests passing across 27 test files

## v1.6.0

Date: 2026-08-11
Status: Completed

Highlights:

- Application PIN entry type (4–12 digit PINs, excluded from password health)
- Unified form architecture: react-hook-form + zodResolver + FieldRenderer
- Merged add/edit forms into single components (EntryForm, NoteForm, PinForm)
- Typography primitives (H1, H2, H3, Text, Muted, Small, Span)
- UI primitives: Textarea, Checkbox, Slider, Select, StatCard, TabButton
- Security: XSS fix for javascript: URLs, transitive dependency vulnerability fixes
- 391 tests passing across 27 test files

## v1.7.0

Date: 2026-08-12
Status: Completed

Highlights:

- Category folders as sub-items under Vault in the sidebar (create, rename, delete inline)
- Category selector dropdown in entry/note/pin forms
- Category quick-assign popover from entry card badge click
- Two-way sync between sidebar folders and vault filter bar via URL
- `cursor-pointer` steering rule and Button base style update
- 391 tests passing across 27 test files

## v1.8.0

Date: 2026-08-13
Status: Completed

Highlights:

- Bulk selection mode in vault list ("Select" toggle button)
- Bulk "Move to folder" for batch category assignment
- Bulk "Delete" with confirmation dialog
- Floating action bar for selected entries (count, actions, cancel)
- Entry cards show checkboxes and highlighted border in selection mode
- 391 tests passing across 27 test files

## v1.9.0

Date: 2026-08-14
Status: Completed

Highlights:

- Visual separators between Favorites, Folders, and Tags in vault filter bar
- Tag autocomplete suggestions from existing vault tags while typing
- Arrow key navigation in tag suggestions dropdown
- 391 tests passing across 27 test files

## v1.9.1

Date: 2026-08-15
Status: Completed

Highlights:

- New entries auto-select the active folder when created from a folder-filtered view
- `defaultCategory` prop on EntryForm, NoteForm, and PinForm
- Vault page passes `?folder` param to `/vault/new` route
- 427 tests passing across 30 test files
