# Chevron Roadmap

This document tracks what's been built, what's in progress, and what's coming next. Each phase ships as its own commit so it can be reviewed, reverted, or cherry-picked independently.

**Status:** `[x]` shipped · `[~]` in progress · `[ ]` planned

---

## Shipped

### Phase 0 — Stability safety net `[x]` _(commit `92aed52`)_

Plugged critical reliability gaps before any feature work.

- `ErrorBoundary` wrapping the app (a render crash no longer produces a blank page)
- Fixed listener leak in `useIsKeyPressed` (cleanup on unmount + reset on window blur)
- Error handling on autocomplete and currency fetches (no more unhandled promise rejections)
- Debounced `localStorage` writes (150 ms) with flush on `pagehide`/`beforeunload`
- Fixed typo (`localSettigns` → `localSettings`) that silently broke settings rehydration

### Phase 1 — UX fixes `[x]` _(commit `67bf8f8`)_

- Tab/Shift+Tab cycles suggestions like a standard combobox
- Page resets to blank after navigating back (via `pageshow`, `popstate`, `visibilitychange`)
- Animation performance: explicit `will-change`, property-specific transitions, rAF-debounced resize, memoized marquee

### Phase 1.5 — Performance hardening `[x]` _(commit `4d10548`)_

- Dropped `axios` for native `fetch` + `AbortController`
- Dropped `react-device-detect` for a 5-line UA helper
- Lazy-loaded Settings and AI panels
- Global `prefers-reduced-motion` support
- Bundle: 1198 KiB → ~1140 KiB

### Phase 2 — Provider-agnostic LLM `[x]` _(commit `1c11fc9`)_

Local-LLM support without ever silently probing localhost.

- Rewrote `createCompletion` to accept a provider config object (base URL, model, API key)
- Supports OpenAI, Ollama, LM Studio, vLLM, and any OpenAI-compatible endpoint
- Safety guardrail: Ollama mode refuses to fire without explicit user-configured URL + model

### Phase 3 — Accessibility + keyboard UX `[x]` _(commit `cddba47`)_

- Full ARIA combobox markup on the query field + suggestions listbox
- `:focus-visible` outlines (keyboard users see them, mouse users don't)
- Focus stealing tamed: interactive elements and `[data-keep-focus]` containers are respected
- Double-Esc full reset (clear → blur)

### Phase 4 — Macros editor + cheatsheet + offline hardening `[x]`

Three additions sharing a common quality bar: the UI works when the network is down.

**4a — Keyboard cheatsheet:** `?` opens a full hotkey reference overlay. No remote assets.

**4b — Offline hardening:**
- `useOnlineStatus` hook + subtle offline indicator pill
- Hardened the JSONP autocomplete path (timeout, cleanup, error handling)
- Audited all boot-time URLs — fonts are local, no CDNs

**4c — In-app macros editor (MVP):**
- JSON-based config editor with import/export
- URL-scheme validator (rejects `javascript:`, `data:`, `vbscript:`, `file:`)
- Persists to localStorage, no server required

### Phase 4.5 — Macros editor: per-field UI `[x]`

Replaced the JSON-only editor with a tabbed interface (Macros, Commands, Engines, Raw JSON). Full form controls: chip input for triggers, gradient color editors, icon picker with autocomplete, drag-to-reorder. No new dependencies.

### Phase 5 — Dependency modernization `[x]`

- Vite 3 → 5, `@vitejs/plugin-react` 2 → 4, `vite-plugin-singlefile` 0.13 → 2.3
- `react-icons` 4 → 5, `framer-motion` 7 → 11
- All upgrades verified by clean builds at each step

### Phase 6 — Bundle splitting + dependency diet `[x]`

Introduced a hosted build profile alongside the static single-file build, and replaced every mid-weight dependency that didn't earn its bytes.

- Two build profiles: `build:static` (inlined single HTML) and `build:hosted` (multi-chunk with hashed filenames)
- Replaced `react-fast-marquee` with pure CSS keyframes
- Replaced `react-markdown` with a 150-line streaming-safe renderer
- Replaced `colorjs.io` with a tiny OKLCH + APCA helper
- Replaced `dateformat` with a 30-line token formatter
- Five npm deps removed, 60+ transitive packages dropped
- Static bundle: ~1140 KiB → ~1073 KiB

### Phase 7 — Compositor-friendly visuals `[~]`

- LayoutButton transitions narrowed to `opacity` only (was `all`)
- SVG path morph → cross-fade was explored and reverted (visual regressions with discrete shapes). The `d`-attribute morph is cheap enough for the two simple bezier paths used.

### Phase 8 — Macro mode reimagined `[x]`

Complete macro menu overhaul: decoupled from search state, type-to-filter, weather widget, touch gestures, glassmorphic visual redesign.

- **8a** — `macroFilter` state slice; Shift = pure toggle; type-to-filter narrows visible cards
- **8b** — Singleton time store (clock survives unmount/remount); ChevronTop shell
- **8c** — Stagger entrance animations, prefix+substring filter scorer, filter pill indicator, ≥56 px hit targets, `@supports`-gated glassmorphism
- **8d** — Weather widget (OpenWeatherMap, TTL cache, 5-day forecast on hover)
- **8e** — Swipe/trackpad gestures via `useGestures` hook
- **Glass overhaul** — Full glassmorphic redesign: `backdrop-filter` surfaces, radial ambient glow, convex plate highlights, spring hover transitions

### Phase 8.5 — Settings schema + migration `[x]`

- JSON-schema validator for the settings tree
- Versioned migration with automatic backup on mismatch
- `settings.version` field for future schema changes

### Phase 15 — Calculator + converters `[x]` _(commit `1721cb3`)_

Instant answers directly in the suggestion list:

- **Calculator** — shunting-yard parser: `+`, `-`, `*`, `/`, `^`, `()`, unary minus, implicit multiplication
- **Currency** — live exchange rates via `open.er-api.com` (free, no key)
- **Weight** — mg, g, kg, t, oz, lb, st and word aliases
- **Time** — ms, s, min, h, d, w, month, yr

All results copy to clipboard on Enter with a confirmation toast.

### Phase 16 — README + project polish `[x]`

- Full README rewrite focused on end users
- Separated roadmap and maintainer docs into their own files
- 6 theme presets added (midnight, forest, burgundy, slate, dune, noir)

---

## In Progress

### Phase 16 — Remaining items `[~]`

- [ ] Screenshots / GIFs of the macro menu, search, and AI completion
- [ ] General polish pass: dead code audit, package.json metadata, badge updates

---

## Planned

### Phase 9 — Security hardening `[ ]`

- Encrypted API key storage (WebCrypto AES-GCM, passphrase-on-first-use per session)
- CSP meta tag on the static build
- Trusted-Types polyfill for macro URL sanitization
- External image origin audit

### Phase 10 — Mobile / touch first-class `[ ]`

Replace the "mobile not supported" banner with a real touch experience.

- Touch-friendly query field (keyboard appears on tap, not on load)
- Larger hit targets across the UI
- Viewport + safe-area handling for notched phones
- PWA install prompt (ties into Phase 11)

### Phase 11 — PWA / offline shell `[ ]`

Requires the `build:hosted` profile from Phase 6.

- Service worker (cache-first shell, network-first autocomplete)
- Web app manifest with proper icons
- Background-sync for search history
- App-shell precache for fully cold starts

### Phase 12 — TypeScript migration `[ ]`

Incremental, file-by-file. `allowJs: true` so existing JS keeps working.

- Store + settings schema first (most leverage)
- Hooks next (`useSuggestions`, `useParseQuery`, `useRedirect`)
- UI components last (many are just a `.jsx` → `.tsx` rename + prop types)

### Phase 13 — Test coverage `[ ]`

Vitest + React Testing Library. Target coverage:

- Search submit, suggestion cycling, settings round-trip
- LLM provider guardrail, Esc reset behavior
- Macros editor save/load, offline indicator transitions
- CI via GitHub Actions

### Phase 14 — Search engine refactor `[ ]`

- Single `interpolate(template, params)` helper replacing ad-hoc regex
- Malformed template detection at config-load time
- Engine-typing as a first-class registry instead of if-chains

---

## Ideas Backlog

Not blocking the main roadmap, but worth grabbing:

- **Localisation** — `react-intl` or a lightweight message catalog
- **Time display settings** — 12/24-hour toggle, locale
- **Settings descriptions** — tooltips for each setting field
- **Redirect button** — visible "Go" button for mouse/touch users
- **Multi-engine results** — suggestions from multiple engines side-by-side
- **Sync layer** — optional WebDAV / local-file sync for settings + macros across machines
- **Self-hosted analytics** — optional Plausible/Umami hook, no data leaves the user's server

---

## Drive-by Fixes

Fixes landed outside the phase system:

- **Shift macro-menu dual-fire** _(landed with Phase 6)_: Shift keydown opened the menu and keyup closed it within the same frame, causing visual glitches. Fixed with `shiftPeekingRef` tracking, `e.repeat` filtering, and a `window.blur` cleanup listener.

---

## Adding a New Phase

1. Pick the next phase number and describe the user-visible outcome
2. Land the work in a commit titled `Phase N — <subject>`
3. Move the entry from Planned to Shipped with the commit SHA

Already-shipped phases keep their numbers forever. Planned phases can be renumbered when priorities shift.
