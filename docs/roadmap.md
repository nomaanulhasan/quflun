# Quflun Roadmap

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

- CSP meta tag with post-build SHA-256 hash extraction script
- Security headers file (`_headers` for Netlify/Cloudflare Pages)
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
