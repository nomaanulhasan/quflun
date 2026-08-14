# Quflun Release Plan

## Tags

| Tag                         | Criteria                                                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `v1-foundation-complete`    | Core engine, services, stores, hooks, and UI pages implemented. 295+ tests. Static export working.                    |
| `v1-utility-pages-complete` | All utility pages (settings, generator, import/export, health check, info pages) implemented and tested.              |
| `v1-pwa-complete`           | Service worker registered, manifest valid, offline caching functional, installable on desktop and mobile.             |
| `v1-beta`                   | CSP enforced, security headers configured, accessibility reviewed, integration tests passing, documentation complete. |
| `v1.0.0`                    | All requirements verified, public repository, open source release.                                                    |

## Release Criteria

### v1-foundation-complete ✅

- [x] Vault engine: create, open, lock, unlock, save
- [x] Entry CRUD with validation
- [x] Secure notes
- [x] Categories (KDBX groups), tags, favorites
- [x] Search engine
- [x] Password generator
- [x] Clipboard manager
- [x] Idle monitor
- [x] KDBX import/export
- [x] CSV import/export
- [x] Health check
- [x] Zustand stores (no persist middleware)
- [x] React hooks
- [x] Lock screen + vault selection
- [x] Entry list with search and filters
- [x] New entry / new note forms
- [x] Edit entry / edit note forms
- [x] Delete confirmation dialog
- [x] 295 tests passing
- [x] Build succeeds

### v1-utility-pages-complete ✅

- [x] Settings page functional
- [x] Import/export page functional
- [x] Health check page functional
- [x] Generator integrated as inline dialog in entry forms
- [x] Security documentation page
- [x] Privacy policy page
- [x] Security limitations page
- [x] All pages accessible offline

### v1-pwa-complete ✅

- [x] Manifest passes installability check
- [x] Service worker caches all assets
- [x] App works fully offline after first load
- [x] Update notification displays correctly
- [x] SW registration skipped in dev mode (prevents stale precache errors)

### v1-beta ✅

- [x] CSP via HTTP headers (`vercel.json` + `_headers`) with `'unsafe-inline'` for Next.js inline scripts
- [x] `'unsafe-eval'` required by argon2-browser Emscripten glue + `'wasm-unsafe-eval'` for Argon2 WASM compilation
- [x] `style-src 'unsafe-inline'` required for Shadcn/Radix runtime styles
- [x] Security headers configured (`vercel.json` + `_headers` file)
- [x] Backup reminder system functional
- [x] Integration tests pass
- [x] Compliance tests pass
- [x] 392 tests passing across 27 test files

### v1.0.0 ✅

- [x] All 25 requirement groups verified
- [x] Public repository published
- [x] README complete with build instructions
- [x] Deployed on Vercel

### v1.1.0 ✅

- [x] Change vault password feature (Settings page)
- [x] Safe 5-step password change process with rollback
- [x] Integrity verification of re-encrypted vault before persisting
- [x] Lighthouse redirect chain fix (trailingSlash)
- [x] 392+ tests passing

### v1.2.0 ✅

- [x] Quick copy actions on entry cards (username, password, URL, open website)
- [x] Quick copy actions on edit entry form fields
- [x] useCopyAction hook, CopyButton, CopyAction, OpenLinkAction components
- [x] Kiro steering: Security Review requirement
- [x] 392+ tests passing

### v1.2.1 ✅

- [x] Favorite star toggleable directly from entry cards
- [x] Touch targets 36px (WCAG AA compliant)
- [x] Icon size 16px (IBM Design Language)
- [x] Native tooltips on icon buttons
- [x] 392+ tests passing

### v1.2.2 ✅

- [x] Entry card UI redesign: colored avatar, strength badge, relative dates
- [x] Password strength indicator (Weak / Fair / Strong)
- [x] "New Entry" card CTA in grid
- [x] Secure note cards show relative update time
- [x] 4-column grid on xl screens (1280px+)
- [x] Component extraction (VaultListView, EntryEditorWrapper, ImportSection, ExportSection)
- [x] Documentation synced through v1.2.2
- [x] 392+ tests passing

### v1.3.0 ✅

- [x] Vault Health page with health score (0–100)
- [x] Detects weak, reused, old passwords + missing fields
- [x] Tabbed format: Credential Health + Vault Integrity
- [x] Merged /health-check into /password-health (redirect preserved)
- [x] Responsive page widths (info, settings, tools)
- [x] Settings 2-column grid on desktop
- [x] About Settings: dynamic version, build date, crypto info
- [x] Navigation consolidated to single "Vault Health" link
- [x] Tests synced with interface changes
- [x] 391+ tests passing

### v1.4.0 ✅

- [x] Custom key-value fields on entries
- [x] Plain text and secret (ProtectedValue) field types
- [x] File attachments in KDBX binary pool (max 10 MB)
- [x] Custom fields editor UI
- [x] Attachments editor: attach, download, remove
- [x] Idle auto-lock connected
- [x] Lock redirects to home page
- [x] 391+ tests passing

### v1.5.0 ✅

- [x] Command palette (Ctrl+K) with fuzzy search
- [x] Configurable keyboard shortcuts with click-to-record UI
- [x] Arrow key navigation in vault entry grid
- [x] `useHotkeys` hook for declarative shortcut registration
- [x] Shortcut hints in command palette actions
- [x] 391+ tests passing

### v1.5.1 ✅

- [x] Transition flash fix (vault selection/unlock)
- [x] Toast text readability in light theme
- [x] Branded `LoadingSpinner` for transitional states
- [x] "Add First Entry" button when vault is empty
- [x] Shell refactored into focused subcomponents
- [x] Command palette split into types, hook, and memo'd components
- [x] 391+ tests passing

### v1.5.2 ✅

- [x] Prettier code formatter with Tailwind plugin
- [x] Viewport-adaptive pagination
- [x] Sticky vault header with scrollable card grid
- [x] Floating "Add Entry" button
- [x] Shared NavLinks + LockButton components
- [x] Shell locked to viewport height
- [x] Mobile UX improvements (search button, hidden shortcuts)
- [x] 391+ tests passing

### v1.6.0 ✅

- [x] Application PIN entry type (4–12 digits)
- [x] Unified form architecture (react-hook-form + zodResolver + FieldRenderer)
- [x] Merged add/edit forms into single components
- [x] Typography primitives (H1–H3, Text, Muted, Small, Span)
- [x] UI primitives (Textarea, Checkbox, Slider, Select, StatCard, TabButton)
- [x] XSS fix for javascript: URLs
- [x] Transitive dependency vulnerability fixes (js-yaml, brace-expansion, fast-uri, @xmldom/xmldom)
- [x] 391+ tests passing

### v1.7.0 ✅

- [x] Category folders in sidebar (create, rename, delete inline)
- [x] Category selector dropdown in forms
- [x] Category quick-assign from entry card badge
- [x] Two-way sync between sidebar and vault filter bar via URL
- [x] cursor-pointer steering rule and Button base style update
- [x] 391+ tests passing

### v1.8.0 ✅

- [x] Bulk selection mode ("Select" toggle)
- [x] Bulk "Move to folder" action
- [x] Bulk "Delete" with confirmation dialog
- [x] Floating action bar for selected entries
- [x] Entry cards with checkboxes and highlight in selection mode
- [x] 391+ tests passing

### v1.9.0 ✅

- [x] Visual separators in vault filter bar
- [x] Tag autocomplete from existing vault tags
- [x] Arrow key navigation in tag suggestions dropdown
- [x] 391+ tests passing

### v1.9.1 ✅

- [x] New entries auto-select active folder category
- [x] `defaultCategory` prop on EntryForm, NoteForm, PinForm
- [x] Vault page passes `?folder` param to `/vault/new`
- [x] 427+ tests passing across 30 test files
