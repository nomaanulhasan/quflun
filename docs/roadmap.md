# Quflun Roadmap

## v1.6.0 (current)

- Application PIN entry type (4–12 digit PINs stored securely, excluded from password health)
- Unified form architecture: react-hook-form + zodResolver + FieldRenderer
- Merged add/edit forms into single components (EntryForm, NoteForm, PinForm)
- FormField universal input renderer with built-in label, error, description, show/hide toggle
- Typography primitives (H1, H2, H3, Text, Muted, Small, Span)
- UI primitives: Textarea, Checkbox, Slider, Select, StatCard, TabButton
- Vault Health shows PINs count separately
- Security: XSS fix for javascript: URLs, protocol allowlist on link actions
- Code quality steering file for consistent development standards

## Upcoming

### v1.7.0 — Category Management

- Category selector dropdown in entry/note/pin forms (assign entry to category on create/edit)
- "Manage Categories" settings page (create, rename, delete categories)
- Category quick-assign from entry card context menu
- Category badge visible on entry cards

### Post-launch Improvements

- Performance validation with larger vaults (500+ entries)
- Accessibility audit with screen readers (NVDA, VoiceOver)
- Community feedback integration

---

## Completed Versions

## v1.5.2

- Prettier code formatter with Tailwind plugin (format on save, `pnpm format`)
- Viewport-adaptive pagination on vault entry list
- Sticky vault header with scrollable card grid
- Floating "Add Entry" button accessible at any scroll position
- Scroll fade mask on sidebar/drawer nav for scroll affordance
- Shared `NavLinks` + `LockButton` components (no duplicate code)
- Shell locked to viewport height — sidebar full-screen, only content scrolls
- Mobile: keyboard shortcuts settings hidden, palette footer hints hidden
- Mobile: search button in header opens command palette
- Command palette no longer lists entries (performance at scale)
- Entry card selection ring desktop-only

## v1.5.1

- Flash of vault selection/unlock transition fix
- Toast text readability in light theme
- Branded `LoadingSpinner` for all transitional states
- "Add First Entry" button when vault is empty
- Shell refactored into focused subcomponents
- Command palette split into types, hook, and memo'd row components

## v1.5.0

- Command palette (Ctrl+K) — fuzzy search entries and quick actions
- Configurable keyboard shortcuts (Alt+N, Alt+Shift+N, Ctrl+L) with click-to-record UI
- Arrow key navigation in vault entry grid (↑↓←→, Home, End, Enter, Space)
- `useHotkeys` hook for declarative global keyboard shortcut registration
- Shortcut hints displayed in command palette

## v1.4.0

- Custom key-value fields on entries (API keys, recovery codes, etc.)
- File attachments in KDBX binary pool (max 10 MB each, encrypted at rest)
- Custom fields editor UI with plain/secret toggle
- Attachments editor: attach, download, remove files
- Idle auto-lock connected to Shell
- Lock redirects to home page

## v1.3.0

- Vault Health: weak, reused, old passwords + missing fields detection
- Health score (0–100) with weighted penalties
- Clickable metrics grid with drill-down to affected entries
- Tabbed format: Credential Health + Vault Integrity in one page
- Merged `/health-check` route into `/password-health`
- Responsive page widths: info pages wider, settings 2-column on desktop
- About Settings: dynamic version, build date, crypto algorithms (no stale data)
- Navigation consolidated: single "Vault Health" link under Tools

## v1.2.2

- UI/UX improvements: card redesign, colored avatars, strength badges, relative dates
- Code optimization: component extraction into dedicated files
- Documentation fully synced with all features through v1.2.2

## v1.2.1

- Favorite star toggleable on entry cards without opening editor
- Touch targets 36px (WCAG AA), icons 16px (IBM Design Language)
- Native tooltips on all icon buttons (desktop hover)

## v1.2.0

- Quick copy actions: copy username, password, URL from entry cards and edit forms
- useCopyAction hook with toast feedback and visual state
- CopyButton, CopyAction, OpenLinkAction reusable components
- Kiro steering: mandatory Security Review for all features

## v1.1.0

- Change vault master password (Settings → Change Password)
- Safe re-encryption with rollback on failure
- Integrity verification before persisting new credentials
- Lighthouse performance: trailing slash redirect fix

## v1.0.0

- All requirements from spec verified
- All property tests passing (25 properties)
- Public repository publication
- Open source release (MIT license)
