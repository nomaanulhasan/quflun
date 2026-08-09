# Quflun Roadmap

## v1.5.0 (current)

- Command palette (`Ctrl+K`) with fuzzy search for entries and quick actions
- `Alt+N` — new password entry
- `Alt+Shift+N` — new secure note
- `Ctrl+L` — lock vault
- Arrow key navigation in vault entry grid
- `Enter` to open selected entry
- `Space` to copy password of selected entry
- Shortcut hints displayed in command palette
- Configurable shortcut bindings (Settings → Keyboard Shortcuts)
- Click-to-record UI with reset-to-defaults
- `useHotkeys` hook for global keyboard shortcuts
- Lightweight fuzzy matching utilities

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


## Upcoming

### v1.6.0 — Browser Extension ⭐⭐⭐

First ecosystem feature. Still fully offline — no cloud sync, no accounts.

- Read local vault (communicate with open Quflun tab or IndexedDB directly)
- Autofill credentials on login forms
- Copy credentials from popup
- Lock/unlock from extension popup
- Match entries by URL domain
- No new network requests — extension reads local storage only

### Pre-release — Real-world Validation

Before making the repository public:

- ~~About page: version, build date, KDBX version, crypto algorithms~~ ✅ (implemented in Settings → About)
- Dogfood period: use Quflun as daily password manager for 2–4 weeks
- Fix workflow friction, missing shortcuts, browser quirks, mobile usability
- Performance validation with larger vaults (100+ entries)

---

## Completed Versions

### v1.2.2

- UI/UX improvements: card redesign, colored avatars, strength badges, relative dates
- Code optimization: component extraction into dedicated files
- Documentation fully synced with all features through v1.2.2

### v1.2.1

- Favorite star toggleable on entry cards without opening editor
- Touch targets 36px (WCAG AA), icons 16px (IBM Design Language)
- Native tooltips on all icon buttons (desktop hover)

### v1.2.0

- Quick copy actions: copy username, password, URL from entry cards and edit forms
- useCopyAction hook with toast feedback and visual state
- CopyButton, CopyAction, OpenLinkAction reusable components
- Kiro steering: mandatory Security Review for all features

### v1.1.0

- Change vault master password (Settings → Change Password)
- Safe re-encryption with rollback on failure
- Integrity verification before persisting new credentials
- Lighthouse performance: trailing slash redirect fix

### v1.0.0

- All requirements from spec verified
- All property tests passing (25 properties)
- Public repository publication
- Open source release (MIT license)
