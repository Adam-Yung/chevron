# Chevron Roadmap

This document tracks the staged improvement plan for Chevron. Each phase
ships as its own commit so it can be reviewed, reverted, or cherry-picked
independently. Smaller drive-by fixes are landed directly without a phase
number.

Status legend: `[x]` shipped &nbsp;·&nbsp; `[~]` in progress &nbsp;·&nbsp; `[ ]` planned.

> **Why does the numbering jump?** Phases 0 through 3 are tied to commit
> messages (`Phase 0: …`, `Phase 1: …`, `Phase 1.5: …`, `Phase 2: …`,
> `Phase 3: …`) so they keep their numbers forever. New phases append
> sequentially. When a planned phase is bumped up in priority, later
> planned phases are renumbered (the earlier "Phase 4 — Dependency
> modernization" became Phase 5 when the user asked for the editor +
> cheatsheet to take Phase 4).

---

## Completed

> Phases 0 → 4 shipped.

### Phase 0 — Stability safety net  `[x]`  &nbsp;_(commit `92aed52`)_

Plug the obvious foot-guns before doing any feature work.

- React `ErrorBoundary` wrapping the app so a single render error no longer
  produces a blank page.
- Fixed listener leak in `useIsKeyPressed` (cleanup on unmount + reset on
  `window.blur` so a held key doesn't get "stuck" when the tab loses focus).
- Added error handling on the autocomplete and currency-conversion fetches so
  a transient network failure no longer rejects an unhandled promise.
- Debounced `localStorage` writes from the settings store (~150 ms) with a
  flush on `pagehide` / `beforeunload`, killing the write storm caused by the
  color-picker drag.
- Fixed a typo (`localSettigns` → `localSettings`) that prevented some
  persisted values from rehydrating.

### Phase 1 — User-reported UX fixes  `[x]`  &nbsp;_(commit `67bf8f8`)_

The four issues the user originally flagged.

- **Tab / Shift+Tab cycles suggestions** like a normal autocomplete combobox
  instead of letting focus escape the field.
- **Return-to-blank after search**: tab-restoration via bfcache (`pageshow`),
  back-button (`popstate`), and `visibilitychange` now resets the store so the
  page comes back to a blank slate instead of being stuck mid-search.
- **Animation perf quick wins**:
  - `will-change: transform, opacity` on `Card.plate`, `Card.logo`, and the
    QuickLook label container.
  - Replaced `transition: all` with explicit property lists.
  - rAF-debounced resize subscription via a single `useViewportSize` hook
    (collapsed two listeners into one).
  - Memoized the `InteractiveBackground` marquee tree.
  - Replaced the post-redirect `setTimeout` with `onAnimationComplete` on
    the motion plate.

### Phase 1.5 — Performance hardening + README build instructions  `[x]`  &nbsp;_(commit `4d10548`)_

Bundle slimming and dev-experience polish.

- **Drop `axios`** in favor of native `fetch` + `AbortController` (with a
  5 s timeout on currency requests).
- **Drop `react-device-detect`** in favor of a 5-line UA helper at
  `src/functions/webUtils/isMobile.js`.
- **Lazy-load** the Settings panel and `AIcompletion` (the latter brings
  `react-markdown`, ~20 KB) so they're not in the first-paint bundle.
- Removed per-chunk `console.log` from streaming completions; hoisted
  `TextDecoder` out of the read loop.
- Global `prefers-reduced-motion` opt-out in `App.css`.
- README gained `Build` section: static build, dev server, production
  preview, plus one-liners for `http-server` / `python -m http.server`.
- Bundle: 1198 KiB → ~1140 KiB; modules 1300 → 1253.

### Phase 2 — Provider-agnostic LLM with Ollama preset  `[x]`  &nbsp;_(commit `1c11fc9`)_

Local-LLM support without ever silently probing localhost.

- Rewrote `createCompletion` to take a `providerConfig` object
  (`baseURL`, `model`, `apiKey`) instead of hard-coded OpenAI URLs.
- `buildUrl` tolerates either a bare host (`http://localhost:11434`,
  appends `/v1/chat/completions`) or a host that already ends in `/vN`.
- `dataParser` skips the SSE `[DONE]` sentinel; `errorParser` tolerates
  both OpenAI's `{error:{message}}` and Ollama's `{error}` shape, plus
  non-JSON error bodies.
- Settings schema: added `provider` (List: `openai` | `ollama`),
  `baseURL`, and `model` fields.
- **Local-LLM safety guardrail**: when the provider is `Ollama`, Chevron
  refuses to send a request unless **both** `baseURL` and `model` are set
  by the user. The UI shows an "AI not configured" hint instead. This
  prevents Chevron from probing `localhost:11434` on machines without
  Ollama installed.

### Phase 3 — Accessibility + keyboard UX  `[x]`  &nbsp;_(commit `cddba47`)_

Make the keyboard / screen-reader path first-class.

- Query input marked up as an ARIA combobox: `role=combobox`,
  `aria-autocomplete=list`, `aria-expanded`, `aria-controls`,
  `aria-activedescendant`.
- Suggestions container is `role=listbox`; each suggestion is
  `role=option` with a stable `id` and `aria-selected` so screen readers
  can follow keyboard-driven selection.
- `:focus-visible` outlines on the field and individual suggestion
  options — visible for keyboard users, invisible for mouse users so the
  minimalist look is preserved.
- **Focus stealing tamed**: switched from a click-on-document refocus
  (which yanked focus from buttons, settings inputs, and the AI panel)
  to a `mousedown` handler that ignores clicks on interactive controls
  and on subtrees marked `[data-keep-focus]`. "Type anywhere and it
  lands in the field" still works via the existing `keypress` handler.
- **Double-Esc full reset**: first Esc clears the visible query
  (existing behavior); a second Esc within 500 ms also drops the
  selected suggestion + AI completion and blurs the input.

---

### Phase 4 — Macros editor + cheatsheet + offline-safe hardening  `[x]`

Three user-facing additions that share a common quality bar: **the UI
must keep working when the network is down, and nothing should silently
break.** This phase intentionally avoids any new network dependency.

**4a — Keyboard cheatsheet overlay**
- [x] New `Cheatsheet` modal listing every hotkey discoverable from the
      app and the macro config (`src/components/Cheatsheet/`).
- [x] Triggered by `?` (Shift+/) when the query field is empty / focus
      isn't trapped in another editor; also via a new corner
      `LayoutButton`.
- [x] Closeable with `Esc`, click-outside, or the close button.
- [x] Marked `[data-keep-focus]` so the QueryField focus grabber leaves
      it alone; focus is restored to the previous element on close.
- [x] No remote assets — icons come from `react-icons` already in the
      bundle, no fonts/images fetched.

**4b — Offline-safe UI hardening**
- [x] `useOnlineStatus` hook based on `navigator.onLine` + `online` /
      `offline` window events, using `useSyncExternalStore`.
- [x] Subtle bottom-left pill (`OfflineIndicator`) that appears when
      offline. `pointer-events: none` so it never blocks the UI;
      `aria-live=polite` so screen readers announce transitions.
- [x] Hardened `fetchFromScriptTag` (the JSONP autocomplete path):
      added `script.onerror` rejection + 5 s timeout + cleanup of the
      injected `<script>` and global callback. Without this, typing
      while offline leaked dead script nodes + globals on every
      keystroke.
- [x] Verified currency and AI fetch paths already degrade gracefully
      (Phase 0 added `.catch` blocks; AI shows the error in the panel
      instead of crashing).
- [x] Audited boot-time URLs — fonts are local, no remote CSS, no
      analytics, no CDNs.
- [x] Macros editor (4c) saves to `localStorage` only; never makes a
      network call by design.

**4c — In-app macros / commands / engines editor (MVP)**
- [x] Loader (`src/classes/localStorage/config.js`): prefers
      `localStorage["chevron.config"]` over `window.CONFIG`, falls
      back to `window.CONFIG` (from `public/config.js`) on first run.
      Applied at boot via `applyPersistedConfigToWindow()` in
      `main.jsx` so all existing consumers see the override without
      touching their code.
- [x] Versioned wrapper: `{ version: 1, macros, commands, engines }`.
- [x] **URL-scheme validator**: rejects `javascript:`, `data:`,
      `vbscript:`, `file:` anywhere in the tree. If forbidden URLs are
      found in stored config, falls back to bundled and logs the
      offending paths instead of executing them.
- [x] MVP editor panel: full-config JSON editor (`MacrosEditor`)
      opened from a new "Edit macros" button in Settings. Live-parses
      JSON; disables Save when invalid; shows the offending JSON path
      for forbidden URL schemes; ⌘/Ctrl+S to save.
- [x] Import / export buttons round-trip the versioned JSON shape.
      Export downloads `chevron-config.json`; import accepts any
      JSON file matching the shape.
- [x] "Load bundled" (preview the bundled config in the editor) and
      "Reset to bundled" (clears the localStorage override).
- [x] Dialog marked `[data-keep-focus]`; uses `:focus-visible` rings
      to match Phase 3 a11y work.
- [ ] **Deferred to Phase 4.5**: per-field UI (color picker for
      bgColor / textColor, chip input for triggers, commands template
      builder, icon picker). The JSON editor handles every existing
      field today, but a friendlier UI is queued.

---

## Planned

### Phase 4.5 — Macros editor: per-field UI  `[ ]`

Replace the JSON-editor MVP from Phase 4c with form-based widgets so
users don't need to know JSON.

- [ ] Macros list with per-row fields: name, category, primary URL,
      triggers (chip input), bgColor / textColor (reuse Settings'
      `ColorPicker`), pinned, optional hotkey, optional icon name.
- [ ] Commands list: type + trigger.
- [ ] Engines list: name + URL templates per query type.
- [ ] Add / remove / reorder for each list.
- [ ] Keep the JSON editor available behind a "raw" toggle for power
      users.

### Phase 5 — Dependency modernization  `[ ]`

Pull every dep onto a current major. Each upgrade is its own sub-commit so
breakage can be bisected.

- [ ] Vite 3 → 5 (rollup 4, esbuild bump; check `vite-plugin-singlefile`
      compatibility — may need the v2 release).
- [ ] Framer Motion 7 → 11 (API mostly stable; the big risk is layout
      animation behavior changes around `<AnimatePresence mode>`).
- [ ] `@mui/joy` `5.0.0-alpha.64` → stable v5 (token names and color
      modes shifted between alpha and stable; `CssVarsProvider` is the
      replacement for the alpha theme provider).
- [ ] `react-icons` and `react-scroll-into-view-if-needed` to current.
- [ ] React 18 → 19 once the above are green.

### Phase 6 — Bundle splitting + first-paint diet  `[ ]`

The single-file build is great for the static zip release but hurts the
hosted / dev experience.

- [ ] Two build profiles: `build:static` keeps `vite-plugin-singlefile`
      for the release zip; `build:hosted` ships a normal multi-chunk
      output for caching.
- [ ] Route-level / panel-level `React.lazy` for `Settings`, `Macros`,
      `QuickLook` (Settings + AIcompletion already done in 1.5).
- [ ] Replace **`react-fast-marquee`** with a pure CSS keyframe
      scroller (saves a dep, runs on the compositor only).
- [ ] Replace **`react-markdown`** with a lighter streaming-friendly
      renderer for AI output (`marked` + sanitizer, or a tiny custom
      parser since we only need bold/italic/code/lists).
- [ ] Replace **`colorjs.io`** in the contrast / theme paths with a
      small APCA helper (~10 KB → <2 KB).
- [ ] Replace **`dateformat`** with `Intl.DateTimeFormat` (need to
      translate the existing format strings).
- [ ] Goal: < 700 KiB hosted bundle, < 350 KiB initial chunk.

### Phase 7 — Compositor-friendly visuals  `[ ]`

The current Chevron / QuickLook animations morph SVG `d` attributes,
which forces a paint on every frame.

- [ ] Pre-compute a small set of path snapshots and cross-fade them
      with `opacity` / `transform` so the entire animation runs on the
      compositor (no main-thread paint).
- [ ] Audit remaining `transition: <length>` usages and convert any
      that can be done with `transform` / `opacity`.
- [ ] Optional: `content-visibility: auto` on offscreen panels.

### Phase 8 — Settings schema + migration  `[ ]`

Right now persisted settings are trusted verbatim — an old localStorage
shape can crash the app silently or get partially merged.

- [ ] Define a JSON-schema-ish validator for the settings tree.
- [ ] On load, validate; on mismatch, run a versioned migration step
      and back up the previous payload under
      `localStorage["chevron.settings.bak.<timestamp>"]`.
- [ ] Add a `settings.version` field and bump it whenever the schema
      changes.
- [ ] Surface the existing "Reset settings" button alongside the new
      migration log.
- [ ] Apply the same pattern to `chevron.config` (introduced in Phase 4).

### Phase 9 — Security hardening  `[ ]`

- [ ] **Encrypted API key storage**: WebCrypto AES-GCM with a
      passphrase prompt on first AI invocation per session, instead of
      plaintext in `localStorage`. Optional: support a backend proxy so
      the key never leaves the server.
- [ ] CSP meta tag on the static build (`default-src 'self'` +
      explicit `connect-src` for the configured AI provider and the
      autocomplete / currency endpoints).
- [ ] Macro-URL sanitizer hardened (Phase 4 ships a basic version;
      this phase adds the Trusted-Types polyfill where supported).
- [ ] Audit external image origins.

### Phase 10 — Mobile / touch first-class  `[ ]`

Replace the current "mobile not supported" banner.

- [ ] Touch-friendly query field (no auto-focus on tap → on-screen
      keyboard appears only on tap).
- [ ] Larger hit targets for suggestions and macros.
- [ ] Swipe gestures for the macros menu (already partially there).
- [ ] Viewport / safe-area handling for notched phones.
- [ ] PWA install prompt (ties into Phase 11).

### Phase 11 — PWA / offline shell  `[ ]`

> **Sequencing note**: this phase deliberately follows Phase 6.
> `vite-plugin-singlefile` (used by the static build) inlines all JS
> into one HTML file, which is fundamentally incompatible with
> `vite-plugin-pwa`'s service-worker model. We need Phase 6's
> `build:hosted` profile (multi-chunk output) before a meaningful PWA
> can land. Until then, runtime offline-resilience is handled by Phase
> 4's `useOnlineStatus` + degrade-gracefully audit.

- [ ] Service worker via `vite-plugin-pwa` on the **hosted** build only
      (cache-first for the shell, network-first for autocomplete).
- [ ] Web app manifest with real `icon-192` / `icon-512` PNGs.
- [ ] Background-sync the search history so it survives a tab crash
      before the localStorage flush.
- [ ] App-shell precache so first paint works on a fully cold network.

### Phase 12 — TypeScript migration  `[ ]`

Incremental, file-by-file.

- [ ] Add `tsconfig.json` with `allowJs: true`, `checkJs: false`,
      `strict: true` for new files.
- [ ] Type the store + settings schema first (most leverage, since
      everything depends on them).
- [ ] Convert hooks (`useSuggestions`, `useParseQuery`, `useRedirect`)
      next.
- [ ] UI components last — many will only need a one-line `.jsx → .tsx`
      rename plus prop typing.

### Phase 13 — Test coverage  `[ ]`

Smoke tests so future refactors aren't blind.

- [ ] Vitest + React Testing Library, run in `jsdom`.
- [ ] Coverage targets:
  - search submit (Enter on a typed query → `redirect` called with the
    expected URL).
  - suggestion cycling (ArrowUp / Down / Tab / Shift+Tab → correct
    `selectedSuggestion` transitions).
  - settings save / load round-trip (simulate localStorage and verify
    debounced flush).
  - LLM provider guardrail (Ollama with no `baseURL` → no fetch fired).
  - Esc-once / Esc-twice reset behavior.
  - Macros editor: edit → save → reload round-trip.
  - Offline indicator: toggle `online` / `offline` events → indicator
    appears / disappears.
- [ ] Wire up CI on push (GitHub Actions: `npm ci && npm run build &&
      npm test`).

### Phase 14 — Refactor search-engines system  `[ ]`

The engine template is interpolated at multiple sites with subtly
different escape rules. Consolidate.

- [ ] Single `interpolate(template, { raw, parsed, command })` helper.
- [ ] Replace ad-hoc `{@}` / `{$}` regex with a tokenizer that flags
      malformed templates at config-load time.
- [ ] Engine-typing (autocomplete, currency, calculator) becomes a
      first-class registry instead of hard-coded `if` chains.

---

## Additional ideas (not yet phased)

Open ideas worth grabbing when you have time but not blocking the main
roadmap:

- **Localisation** — already in the legacy TODO list. Plug in `react-intl`
  or a tiny custom message catalog; start with English + the maintainer's
  native language.
- **Weather widget** (legacy TODO) — needs a free API and a graceful
  offline state.
- **Time settings** (legacy TODO) — choose 12 / 24-hour, locale.
- **Settings field descriptions** (legacy TODO) — already half-implemented
  via `HelpTooltip`; needs copy.
- **"Legacy" mode** (legacy TODO) — what was the original intent? Worth
  a separate design pass before scheduling.
- **Redirect button** (legacy TODO) — visible "Go" button next to the
  field for mouse / touch users.
- **Telemetry-free analytics**: optional self-hosted Plausible / Umami
  hook so users can measure their own usage without leaking anywhere.
- **Theme presets**: a small library of bundled themes beyond the
  current single picker.
- **Multi-engine results**: optionally show suggestions from multiple
  search engines side-by-side.
- **Sync layer**: optional WebDAV / local-file sync so settings + macros
  travel between machines without an account.

---

## How to add a phase

1. Pick the next phase number, sketch the user-visible outcome in one
   paragraph, and list the concrete tasks.
2. Land the work in a single commit titled `Phase N — <subject>`.
3. Move the entry from `Planned` to `Completed`, paste the commit SHA,
   and check the box.

If a planned phase is bumped up in priority (as Phase 4 was), insert it
at the desired number and renumber the later planned phases. Already-
shipped phases never get renumbered — their numbers are immortalized in
commit history.
