# Quflun Roadmap

## v1.2.2 (current)

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

## v1-utility-pages

- Settings page (idle timeout, clipboard timeout, theme selector, backup reminder)
- Import/export page (file picker UI, KDBX password prompt, CSV upload, result summary)
- Health check page (trigger button, results display, backup recommendation)
- Password generator standalone page
- Security documentation page (algorithms, KDF, format version)
- Privacy policy page (no data collected, local-only)
- Security limitations page (browser constraints, clipboard behavior, JS memory)

## v1-pwa-complete

- Web App Manifest (icons, start_url, display: standalone)
- Serwist service worker (precache, runtime caching)
- Offline asset caching (all JS/CSS/HTML/fonts/WASM)
- Update notification UI (new version available → activate)
- SW registration failure handling (warning banner)
- PWA installability verification

## v1-beta

- CSP via HTTP headers (`vercel.json` + `_headers`) with `'unsafe-inline'` for Next.js inline scripts
- Security headers (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`)
- Backup reminder system (first-time + periodic)
- Accessibility audit (screen reader testing, focus management)
- Performance profiling (10K entries load time, search latency)
- Integration tests (full vault lifecycle end-to-end)
- Compliance tests (no telemetry, no external requests, no forbidden storage)
- README with build instructions and tech stack

## v1.0.0

- All requirements from spec verified
- All property tests passing (25 properties)
- Public repository publication
- Open source release (MIT license)
- SECURITY.md finalized with contact information
- CONTRIBUTING.md opened for public contributions
