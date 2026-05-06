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

> Phases 0 → 6 shipped.

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

### Phase 4.5 — Macros editor: per-field UI  `[x]`

Per-field UIs replacing the JSON-only MVP. The editor now opens with
four tabs: **Macros**, **Commands**, **Engines**, **Raw JSON**.

- [x] Macros tab: per-row card with collapse/expand. Fields: name,
      category, url, normalisedURL, triggers (chip input with
      Enter/Tab/comma to commit, Backspace to pop), `bgColor` (full
      solid + gradient editor with native color pickers, gradient
      stops, type and angle), `textColor`, pinned checkbox, optional
      hotkey, icon name (with datalist autocomplete from
      `window.ICONS`), per-macro commands sub-list.
- [x] Commands tab: editable type + trigger pairs.
- [x] Engines tab: per-engine card (name, id rename, bgColor, textColor,
      per-type templates).
- [x] Add / remove / reorder buttons on every list.
- [x] Raw JSON tab preserved as a power-user fallback. State stays in
      sync between form tabs and the JSON view (edits in either side
      flow into a shared cfg object).
- [x] No new heavy deps (no MUI Joy in the editor, no `react-colorful`,
      no `colorjs.io`). All inputs are native HTML controls — keeps
      the editor lean and fully offline-capable.

### Phase 5 — Dependency modernization  `[x]`

Safe major bumps verified by build at each step.

- [x] Vite 3.2.3 → **5.4.21**.
- [x] `@vitejs/plugin-react` 2.2.0 → **4.7.0** (Vite 5 compatible).
- [x] `vite-plugin-singlefile` 0.13.3 → **2.3.3** (Vite 5 compatible).
- [x] `react-icons` 4.7.1 → **5.6.0**.
- [x] `framer-motion` 7.8.0 → **11.18.2** (build clean; existing
      `AnimatePresence` + `motion.div` + `useAnimationControls` usage
      survived without API changes).
- [x] `react-scroll-into-view-if-needed` already on 3.0.1 (current).

**Deferred** (intentionally — high blast radius, separate phases):
- `@mui/joy` `5.0.0-alpha.64` → stable v5: token names and the
  `CssVarsProvider` setup shifted; the Settings panel uses Joy
  pervasively. The Settings chunk is already lazy-split (Phase 6),
  so the Joy weight no longer sits in the initial paint. The
  remaining win from a Joy swap is purely "drop the Settings chunk
  size", which is queued for its own phase.
- React 18 → 19: StrictMode behavior change (double-effects in
  development) interacts with the focus-management work in Phase 3,
  so a review pass is warranted before bumping.
- ESLint 8 → 9: requires migrating to the flat-config schema; not
  worth it until the test setup in Phase 13 lands.

### Phase 6 — Bundle splitting + first-paint diet  `[x]`

The single-file build was great for the static zip release but hurt the
hosted / dev experience. Phase 6 keeps the static profile intact and
introduces a hosted profile alongside it, while replacing every
mid-weight dependency that didn't earn its bytes.

- [x] **Two build profiles** wired into `vite.config.js` via Vite's
      `--mode`:
  - `npm run build:static` → singlefile output (release zip,
    Express-served local backend).
  - `npm run build:hosted` → multi-chunk Vite output with content
    hashes on every asset name.
- [x] Route-level / panel-level `React.lazy` for `MacrosMenu`
      (Splide ~25 KB) added on top of the existing
      `Settings`/`AIcompletion`/`Cheatsheet`/`MacrosEditor` lazies.
      `QuickLook` deliberately stayed eager — it's mounted on first
      paint alongside `Chevron` and lazy-loading would just add a
      Suspense flicker on the search animation.
- [x] Replaced **`react-fast-marquee`** with a pure CSS keyframe
      scroller (`.marquee-track`, `@keyframes marquee-scroll`). Runs
      entirely on the compositor; `prefers-reduced-motion` disables
      the animation outright.
- [x] Replaced **`react-markdown`** (and its `unified` /
      `mdast-util-from-markdown` chain) with a ~150-line renderer
      (`src/functions/generationUtils/renderMarkdown.jsx`). Handles
      headings / bold / italic / inline + fenced code / lists / safe
      links, and tolerates unterminated fences for streaming output.
      URL allow-list (`http(s)`, `mailto`, `/`, `#`) prevents
      `javascript:` injections.
- [x] Replaced **`colorjs.io`** with a tiny `Color` class in
      `src/functions/generationUtils/color.js` covering the exact
      operations the app uses: hex / rgb parsing, OKLCH-based
      lighten / darken (`set({ 'lch.l': fn })`), and APCA contrast
      via the public SAPC reference math.
- [x] Replaced **`dateformat`** with a token-compatible 30-line
      formatter (`src/functions/generationUtils/formatDate.js`).
      Existing user-saved format strings keep producing the same
      output (`h:MM` still renders hour-12 + month, matching the old
      lib's quirks intentionally).
- [x] **Cache versioning**: a custom Vite plugin
      (`publicCacheBust`) appends `?v=<package version>` to
      `<script src="config.js">` and `<script src="icons.js">` so a
      version bump invalidates the browser's cached copy of the
      stable-named helper scripts. Vite's default content hashes
      cover the rest of the asset graph.
- [x] **Result** (static profile):
  - Bundle: ~1140 KiB → ~1073 KiB.
  - Modules: 1253 → 1140.
  - Five npm deps removed: `colorjs.io`, `dateformat`,
    `react-markdown`, `react-fast-marquee`, plus 60+ transitive
    packages dropped from the lockfile.
- [x] **Result** (hosted profile):
  - Initial chunk: ~557 KiB raw / ~176 KiB gzipped.
  - Lazy chunks: `MacrosMenu` (45 KiB), `Settings` (25 KiB),
    `MacrosEditor` (23 KiB), `AIcompletion` (8 KiB), `Cheatsheet`
    (4 KiB).
  - The 350 KiB initial-chunk goal isn't hit yet — the bulk of the
    initial chunk is now `framer-motion` + `@mui/joy`'s emotion
    runtime. Phase 7 (compositor-friendly visuals) and the deferred
    `@mui/joy` swap are the right places to attack that.

### Phase 7 — Compositor-friendly visuals  `[~]`

The cross-fade approach (N stacked static paths opacity-faded) was
reverted for Chevron and QuickLook after causing visual regressions:
cross-fading between discrete shapes looked like popping/blinking
rather than smooth morphing, and invisible overflow paths from stage 4
(the full-width stretched bar) disrupted layout. The perf gain for
2-bezier SVG paths is also near-zero in practice.

What actually shipped from Phase 7:

- [x] **LayoutButton**: `transition: all .3s` → `transition: opacity .3s`.
      The button only ever animates opacity; `transition: all` was
      needlessly animating every layout property on each state change.
- [ ] SVG path morph → compositor cross-fade: **reverted**. The correct
      approach would require the shapes to be visually identical at each
      keyframe boundary so a cross-fade is imperceptible. That's only
      possible if the shapes are redesigned as layered elements that
      happen to share endpoints — a larger design task than a simple
      refactor. Deferred indefinitely; the `d` morph is cheap enough
      for these two simple paths.

### Phase 8 — Macro mode reimagined  `[x]`

Decouple the macro menu from the search-mode state machine, fix the
clock under animation churn, add an OpenWeatherMap widget, type-to-
filter the macros menu, and make the menu touch-friendly with gestures.
Full design + sub-commit breakdown lives in `Macro_menu_redesign.md`.
Sequencing interleaves Phase 7 between 8b and 8c so the new
animations land on top of compositor-only primitives.

- [x] **8a Decoupling** — new `macroFilter` slice; right-click in any
       non-default mode = full reset; Shift = pure toggle (no tap/hold
       distinction); QueryField yields focus while macro mode is
       active; `MacrosMenu` reads `macroFilter` and narrows the visible
       cards. Card hints became always-on (touch-suppressed) with a
       dynamic "next char to narrow" character driven by the filter.
- [x] **8b Time singleton + ChevronTop shell** — `useSyncExternalStore`-
       backed module-scope time store so the clock keeps ticking across
       any unmount/remount churn; new `ChevronTop` component hosting
       the clock with a future slot for the weather widget.
- [x] **8b_continued — three regressions to clean up before Phase 7**
       (see `Macro_menu_redesign.md` § 3.3 for the full spec). Fixed:
  - [x] **Clock still pinned**: root cause was Vite HMR loading a
         fresh `timeStore.js` module while the original `setInterval`
         kept mutating the OLD module's `nowMs`. Added
         `import.meta.hot.dispose(() => clearInterval(intervalHandle))`
         so only the live module's timer runs (§ 3.3.1).
  - [x] **Hint slide-in too short**: restored 2.5 s keyframe duration
         in `Card.module.css` for the dramatic diagonal sweep
         (`-10% → 20%` translate on the rotated element) (§ 3.3.2).
  - [x] **Hint animation did not fire on initial open**: framer-motion's
         `<motion.div>` was attaching inline transform styles that
         clobbered the CSS keyframe's `from` state. Replaced with a
         plain `<div>`; also pre-warmed the MacrosMenu lazy chunk on
         idle so the chunk is loaded before the first open (§ 3.3.3).
- [x] **(Phase 7 lands here)** — compositor-friendly visuals so 8c's
       new animations are built on the right primitives from day one.
       See the Phase 7 entry above.
- [x] **8c MacrosMenu redesign** — stagger entrance built on Phase 7's
       primitives, hand-rolled prefix+substring filter scorer (no new
       deps — Phase 6 spirit), `MacroFilterPill` indicator above the
       menu, ≥56 px hit targets, optional glassmorphism behind a
       `@supports` query + opt-in settings switch (off by default),
       MacrosEditor icon picker.
- [x] **8d Weather widget** — lazy chunk; OpenWeatherMap geocoding +
       `/weather` + `/forecast`; `LocalStorageObject` TTL cache; new
       `weather` settings tab with a "resolve coordinates" flow; today-
       only by default, slide-down 5-day strip on hover/tap.
- [x] **8e Gestures** — `useGestures` hook (swipe up/down + trackpad
       horizontal pagination); the mobile banner stays as-is in this
       phase (touch-banner restructure remains Phase 10's job).
- [x] **Glass overhaul** — Direction 1 glassmorphic visual redesign
       across the entire UI. Cards: `backdrop-filter` glass surface with
       radial ambient glow from each macro's brand color, convex plate
       highlight, diagonal hint letter visible through the glass, spring
       hover/active transitions. MacrosMenu container: single compositor
       backdrop-filter layer. Filter pill: glass capsule. ChevronTop:
       faint glass shelf. Suggestions: glass pills with tinted selection
       state. Weather chip: recalibrated sizes. All built on
       `@supports` guards with solid fallbacks.

### Phase 8.5 — Settings schema + migration  `[ ]`

> Bumped from Phase 8 to make room for the macro redesign work.

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

### Phase 15 — Calculator + converters  `[ ]`

Builds on Phase 14's engine-typing refactor. Surfaces "instant answer"
results above the suggestions list for math, currency, weight, and
time queries.

- [ ] **Calculator engine**: parse `2+2*3`-style queries; show inline
      result above suggestions. ~200-line shunting-yard parser to keep
      the bundle small (no `nerdamer` / `mathjs`).
- [ ] **Currency converter**: formalize the existing currency path as
      a registered engine type with the same surface as the calculator.
- [ ] **Weight converter**: `100kg in lb`, `5oz in g`. Static unit
      table; no external lib.
- [ ] **Time converter**: `9am pst in tokyo`, `2h30m in seconds`. Use
      `Intl.DateTimeFormat` for timezone resolution; no external lib.
- [ ] All four feed into the same "instant answer" UI above suggestions.

### Phase 16 — README rewrite + project polish  `[ ]`

After the macro redesign lands, the customer-facing README is overdue
for a rewrite. Today's README mixes user-facing content with maintainer
material that belongs elsewhere.

- [ ] **Rewrite README** to clearly demonstrate the new behaviors and
      capabilities: macro mode (Shift toggle, type-to-filter, gestures),
      cheatsheet, weather widget, AI completion, offline-safe path,
      build profiles, configurability via the in-app editor.
- [ ] **Declutter**: pull the roadmap, TODOs, and any maintainer-only
      notes out of README. The roadmap lives in `Roadmap.md`; the
      maintainer guide lives in `Maintainer.md`. README stays focused
      on "what is this and how do I use it".
- [ ] **Add screenshots / GIFs** of the macro menu, search, and AI
      completion so the README sells the product before the install
      instructions.
- [ ] **Cross-link** `Roadmap.md` and `Maintainer.md` at the bottom of
      README under a "For contributors" footer.
- [ ] **General polish pass**: audit naming, dead code, leftover phase
      stubs, README badges (build status when CI lands in Phase 13),
      LICENSE block visibility, package.json description / keywords /
      repository fields.

---

## Drive-by fixes (not part of any phase)

- **Shift macro-menu toggle dual-fire** _(landed alongside Phase 6)_:
  Pressing Shift opened the menu (`keydown` → `mode='opened'`) and
  releasing it closed the menu (`keyup` → `mode='default'`). A quick
  tap fired both within the same animation frame, so the open and
  close transitions interleaved and produced visual glitches. Pressing
  Shift while the menu was already open via the side button also
  closed it as a side-effect.
  - `App.jsx` now tracks `shiftPeekingRef` so `keyup` only reverts
    state if the matching `keydown` is what opened the menu.
  - `e.repeat` is filtered so OS key auto-repeat can't re-fire the
    open transition while Shift is held.
  - A `window.blur` listener clears the peek flag so a held Shift
    doesn't get "stuck" if the user alt-tabs away.

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
