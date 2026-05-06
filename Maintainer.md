# Chevron — Maintainer Guide

A working tour of the codebase for someone who's about to make changes.
For *what* the project does, see `README.md`. For the running roadmap of
phased improvements, see `Roadmap.md`. This document covers *how* the
codebase is organized and *where* to make changes.

## Table of contents

- [Tech stack at a glance](#tech-stack-at-a-glance)
- [Directory map](#directory-map)
- [How the app boots](#how-the-app-boots)
- [Core data flow: a query from keystroke to redirect](#core-data-flow-a-query-from-keystroke-to-redirect)
- [State management](#state-management)
- [Settings system](#settings-system)
- [Macros / commands / engines](#macros--commands--engines)
- [Theming](#theming)
- [Animations](#animations)
- [Networking and offline behavior](#networking-and-offline-behavior)
- [The AI completion path](#the-ai-completion-path)
- [Accessibility conventions](#accessibility-conventions)
- [Build, package, and distribution](#build-package-and-distribution)
- [Performance notes and pitfalls](#performance-notes-and-pitfalls)
- [Where to add common features](#where-to-add-common-features)
- [Testing (or lack thereof)](#testing-or-lack-thereof)

---

## Tech stack at a glance

| Layer            | Choice                                                | Why it's here / what to know |
| ---------------- | ----------------------------------------------------- | ---------------------------- |
| Framework        | React 18                                              | Uses `useSyncExternalStore`. React 19 migration deferred (see Roadmap Phase 12 once promoted). |
| Build            | Vite + `vite-plugin-singlefile`                       | The static build inlines **everything** into one HTML file. See [Performance notes](#performance-notes-and-pitfalls). |
| Animation        | Framer Motion                                         | Used for page transitions, panels, and the chevron morph. Some animations are still SVG `d`-attribute morphs (paint cost — Roadmap Phase 7). |
| UI primitives    | MUI Joy (alpha)                                       | Only used inside the **Settings** panel + `MacrosEditor`. The startpage UI itself is hand-rolled CSS modules. |
| Color math       | `colorjs.io`                                          | APCA contrast for theme legibility. Roadmap Phase 6 wants to swap this for a 50-line helper. |
| Markdown         | `react-markdown`                                      | Only used in `AIcompletion`. Big chunk; Roadmap Phase 6 wants to swap. |
| Date formatting  | `dateformat`                                          | Roadmap Phase 6 wants `Intl.DateTimeFormat`. |
| Marquee          | `react-fast-marquee`                                  | Roadmap Phase 6 wants pure CSS. |
| Color picker     | `react-colorful`                                      | Used inside Settings → ColorPicker. |
| Inline SVG       | `react-inlinesvg`                                     | For macro icons defined in `public/icons.js`. |
| Carousel         | `@splidejs/react-splide`                              | Used by `MacrosMenu`. |
| Search index     | `minisearch`                                          | Used by the history suggestion class. |

There is **no test framework** today. Roadmap Phase 13 introduces Vitest
+ React Testing Library.

---

## Directory map

```
chevron/
├── README.md                  ← user-facing docs
├── Roadmap.md                 ← phased improvement plan + commit SHAs
├── Maintainer.md              ← (you are here)
├── package.json
├── vite.config.js             ← single-file build config
├── index.html                 ← entry HTML; inlines coloration <script>
├── public/
│   ├── config.js              ← bundled CONFIG (macros / commands / engines)
│   ├── icons.js               ← bundled ICONS (SVG strings)
│   ├── font.css               ← @font-face for local TTFs
│   └── fonts/                 ← Onest TTFs
├── settings/
│   └── settings.js            ← settings schema + types (default values)
├── backend/                   ← optional Node service for "Hosted" install
│   ├── server.cjs
│   └── register.cjs
└── src/
    ├── main.jsx               ← entry: applies persisted CONFIG, mounts <App>
    ├── App.jsx                ← root layout, page-mode switching, modals
    ├── App.css / App.module.css
    ├── rules.js               ← which keys / modes drive which components
    ├── currencies.js          ← ISO currency code list (autocomplete guard)
    ├── chatGPT/
    │   ├── createCompletion.js  ← provider-agnostic SSE streaming client
    │   └── Icon.jsx             ← AI icon
    ├── autocomplete/
    │   └── googleAutocomplete.js  ← JSONP-style fetch via fetchFromScriptTag
    ├── classes/
    │   ├── miniStore.js         ← tiny pub/sub store (used by createOptimisedContext)
    │   ├── parsedQuery.js       ← query → URL transformation result
    │   └── localStorage/
    │       ├── history.js       ← search history + minisearch index
    │       └── config.js        ← versioned macros override loader (Phase 4)
    ├── components/
    │   ├── ActiveElements/      ← background visuals (chevron, marquee, time, quicklook)
    │   ├── AIcompletion/        ← lazy-loaded; talks to OpenAI/Ollama/etc.
    │   ├── Card/                ← search-result Card (post-redirect animation)
    │   ├── Cheatsheet/          ← keyboard cheatsheet modal (Phase 4)
    │   ├── Chevron/             ← the animated chevron logo
    │   ├── ErrorBoundary/       ← top-level <ErrorBoundary> wrap
    │   ├── InteractiveBackground/  ← marquee strip
    │   ├── LayoutButton/        ← corner buttons (settings, cheatsheet, macros)
    │   ├── MacrosEditor/        ← in-app config editor (Phase 4 + 4.5)
    │   ├── MacrosMenu/          ← swipeable macros launcher (right-bottom)
    │   ├── Notification/        ← toast-ish notifications
    │   ├── OfflineIndicator/    ← bottom-left offline pill (Phase 4)
    │   ├── QueryField/          ← the central input + key handling
    │   ├── QuickLook/           ← inline preview rendering
    │   ├── Settings/            ← lazy-loaded; MUI Joy panel for settings
    │   ├── Suggestions/         ← suggestion listbox (ARIA combobox option list)
    │   ├── TextareaAutosize/    ← used by some Settings inputs
    │   ├── Time/                ← clock widget
    │   └── TransitionController/ ← wraps animation lifecycles
    ├── contexts/
    │   ├── Settings.jsx         ← provides settings + theme + colorScheme
    │   ├── Store.jsx            ← per-render shared state (mode, query, redirected)
    │   └── createOptimisedContext.jsx  ← selector-friendly context factory
    ├── functions/
    │   ├── getMacro.js          ← query → matching macro lookup
    │   ├── animUtils/           ← easings, scheduler
    │   ├── dataUtils/           ← copyObj, propertyByPath, pseudoHash, etc.
    │   ├── generationUtils/     ← getClasses (gC), color helpers, gradient util
    │   └── webUtils/            ← URL helpers, fetchFromScriptTag, isMobile
    └── hooks/
        ├── useColorSchemeDetector.js
        ├── useIsKeyPressed.js
        ├── useOnlineStatus.js   ← Phase 4
        ├── useParseQuery.js     ← query → ParsedQuery (URL + display string)
        ├── useRedirect.js       ← does the actual location.assign with a fade
        ├── useSuggestions.js    ← merges autocomplete + history + currency
        └── useTransitions.js
```

---

## How the app boots

1. `index.html` runs the inline `<script>` that reads
   `localStorage.settings` and sets the document background color,
   so the page paints in the right color **before** React loads.
2. `<script src="config.js">` and `<script src="icons.js">` set
   `window.CONFIG` and `window.ICONS`.
3. `src/main.jsx` runs:
   - `applyPersistedConfigToWindow()` (Phase 4): if the user has saved a
     custom CONFIG via the `MacrosEditor`, it replaces `window.CONFIG`
     with the persisted version *before* React mounts.
   - Renders `<ErrorBoundary><SettingsProvider><StoreProvider><App/>`.
4. `App.jsx` registers global key/mouse listeners, picks the initial
   layout (mobile warning vs main UI), and mounts the cheatsheet +
   offline indicator.

If you need to do something at boot, **`main.jsx` is the place** —
adding a new wrapper context, a polyfill, or another window-level
side effect goes there.

---

## Core data flow: a query from keystroke to redirect

```
   user types → window 'keypress' event
                    ↓
   QueryField.onKeyPress → focus the input, double-space → setAiQuery
                    ↓
   <input onChange> → handleQueryChange → updateStore({ query, mode })
                    ↓
   useStateSelector picks up the new query
                    ↓
   useSuggestions(query) → autocomplete + history + currency in parallel
                    ↓
   useParseQuery(query, …) → resolve macro/command, build URL → parsedQuery
                    ↓
   <Suggestions> renders listbox with role=option items
                    ↓
   user hits Enter → QueryField.onKeyDown → handleRedirect()
                    ↓
   useRedirect(url) → set redirected=true (fade out), location.assign(url)
                    ↓
   browser navigates away
                    ↓
   later: pageshow / popstate / visibilitychange → resetStore() → blank page
```

Key fact: **the QueryField is the always-focused root of all keyboard
input.** A focus grabber listens on `mousedown` (Phase 3) and re-focuses
the input unless the click was on an interactive element or inside
`[data-keep-focus]`. If you add a panel/modal that needs to keep its
own focus, mark its outer container with `data-keep-focus="true"`.

---

## State management

There are **two** state systems:

### 1. `SettingsProvider` (`src/contexts/Settings.jsx`)

Holds the persisted user settings tree from `settings/settings.js`. Read
via `useContext(SettingsContext)`; write via `useContext(SetSettingsContext)`.
Persists to `localStorage["settings"]` with a 150 ms debounce + flush on
`pagehide` / `beforeunload`.

Also exports two derived contexts:
- `ThemeContext` — the active theme's color tokens
- `ColorSchemeContext` — `light` | `dark` | `auto`

### 2. `StoreProvider` (`src/contexts/Store.jsx`)

Tiny ephemeral per-tab store using a custom `createOptimisedContext`
that wraps `MiniStore` (a pub/sub) so components can subscribe to
**slices** without re-rendering on every change.

Fields:
- `mode`: `'default' | 'searching' | 'opened'`
- `query`: current input text
- `selectedSuggestion`: the keyboard-/mouse-selected suggestion (or null)
- `redirected`: true after the user submitted; prevents re-firing
- `timestamp`: bumped by `resetStore()` to force `<motion.div>` re-mount

Hooks:
- `useStateSelector(s => s.field)` — subscribe to a slice (re-renders only on slice change)
- `useUpdate()` — returns a `(partial) => void` that respects `redirected`
- `useReset()` — returns a function that resets the whole store

**Rule of thumb:** persistent app state goes in Settings. Per-session UI
state (mode, query, etc.) goes in Store.

---

## Settings system

`settings/settings.js` is the single source of truth. It exports:

```js
{
  template: { ...defaultSettings },     // the initial / default tree
  hidden: [ 'category', ... ],          // categories hidden behind the eye toggle
  types: { Input, List, Number, ... }   // type constructors used by the editor
}
```

To add a new setting:
1. Pick the category (or add one) in `settings/settings.js`.
2. Use one of the type constructors (`new types.Input(default, placeholder)`,
   `new types.List(default, options)`, `new types.Number(...)`, etc.).
3. Read it anywhere via `useContext(SettingsContext).<category>.<field>`.
4. The Settings panel auto-renders an editor for it (`Category` walks
   the template and dispatches by type to a `Property` editor).

To add a **new editor type** (e.g., a date picker), add it to
`src/components/Settings/Property/Property.jsx` and to `settings/settings.js`'s
`types` export.

---

## Macros / commands / engines

Two layers:

### Bundled (`public/config.js`)
Sets `window.CONFIG = { macros, commands, engines }` synchronously
before React loads. Edit this file to ship a new default macro.

### Persisted override (`src/classes/localStorage/config.js`, Phase 4)

```js
loadConfig()        // localStorage.chevron.config (validated) → fallback to bundled
saveConfig(next)    // validates URL schemes, writes localStorage, mirrors to window.CONFIG
resetConfig()       // drops the override, restores bundled
applyPersistedConfigToWindow()   // boot helper; called from main.jsx
```

**URL-scheme guardrail:** `findForbiddenUrls()` rejects `javascript:`,
`data:`, `vbscript:`, `file:` anywhere in the persisted tree. If found,
the persisted blob is ignored and the bundled config is used (with a
warning logged).

Consumers of `window.CONFIG`:
- `src/functions/getMacro.js` — query → matching macro
- `src/components/MacrosMenu/MacrosMenu.jsx` — pinned macros menu
- `src/hooks/useParseQuery.js` — engine + macro URL templating
- `settings/settings.js` — engine list for the engine picker

The `MacrosEditor` UI lives in `src/components/MacrosEditor/`. Phase 4
ships a JSON editor; Phase 4.5 adds per-field UI (color pickers, chip
input for triggers, etc.) while keeping the JSON editor as a "raw"
toggle.

---

## Theming

`SettingsProvider` exposes a `ThemeContext` whose values are written to
the document root as CSS custom properties:

```js
document.documentElement.style.setProperty('--' + variable, theme[variable])
```

So in CSS you can use `var(--primary)`, `var(--secondary)`,
`var(--query)`, `var(--accent)`, etc. The pre-React inline script in
`index.html` reads the persisted settings and sets the body background
**before** React mounts so there's no flash of the wrong color.

`useColorSchemeDetector` (in `src/hooks/`) picks `light` or `dark` based
on `prefers-color-scheme` when the setting is `auto`.

---

## Animations

- **Framer Motion** for page transitions and modals (`<AnimatePresence>`,
  `<motion.div>` with `initial` / `animate` / `exit`).
- **CSS modules** for hover / state transitions. Phase 1 audit: prefer
  explicit `transition: opacity 200ms` over `transition: all` and add
  `will-change: transform, opacity` to elements that animate every
  frame.
- **`prefers-reduced-motion`**: respected globally in `App.css` and on a
  per-component basis in some module CSS.

The chevron morph in `src/components/Chevron/` is currently animating
the SVG `d` attribute — that's a paint on every frame. Roadmap Phase 7
plans to replace it with cross-faded snapshots.

---

## Networking and offline behavior

All fetches must degrade gracefully when offline. Conventions:

- **`fetchFromScriptTag`** (JSONP for Google autocomplete): Phase 4
  hardened it with `script.onerror`, a 5 s timeout, and cleanup of the
  injected `<script>` + global callback. Without these, every keystroke
  while offline leaked DOM nodes + globals.
- **`useSuggestions`**: each fetch is wrapped in `.catch()` (autocomplete)
  or `try/catch` (currency). Failures are silently logged via
  `console.warn`; the rest of the suggestions still render.
- **`AIcompletion`**: the streaming fetch's `.catch` writes the error
  into the completion panel as a markdown error block. The provider
  config is validated *before* sending; missing config shows an "AI not
  configured" hint instead of probing localhost.
- **`useOnlineStatus`** (Phase 4): `useSyncExternalStore` over the
  `online`/`offline` window events. Drives the `OfflineIndicator` pill.

When adding a new fetch:
1. Use `AbortController` + a timeout.
2. Wrap in `try/catch` and either log + ignore or surface via the UI.
3. Don't crash the app on network failure.
4. Don't spin a UI element forever — always resolve or reject within
   the timeout.

---

## The AI completion path

Provider-agnostic OpenAI v1 schema. Configured in
`Settings → Query → AI`:

- `provider`: `openai` | `ollama`
- `baseURL`: optional override
- `model`: required for Ollama; optional for OpenAI
- `apiKey`: required for OpenAI; ignored for Ollama

Code path:
1. `AIcompletion.jsx` → `resolveProviderConfig(aiSettings)` returns
   `{ provider, config, missing }`. If `missing` is non-null, show the
   hint and **don't fire**. (This is the Ollama guardrail: no localhost
   probing without explicit user opt-in.)
2. `createCompletion(setCompletion, messages, temperature, providerConfig)`
   in `src/chatGPT/createCompletion.js` opens an SSE stream and pipes
   chunks into `setCompletion` via `dataParser`.
3. `errorParser` tolerates both OpenAI's `{error:{message}}` and
   Ollama's `{error}` shape, plus non-JSON bodies.
4. The completion is shown inside `AIcompletion` via `react-markdown`.

To add a new provider preset, edit `PROVIDER_DEFAULTS` in
`AIcompletion.jsx` and add a new entry to `query.AI.provider` in
`settings/settings.js`. If it needs special URL building, extend
`buildUrl()` in `createCompletion.js`.

---

## Accessibility conventions

(Phase 3 work — keep this discipline going.)

- **Focus stealing**: a `mousedown` handler in `QueryField.jsx`
  re-focuses the input. **It skips** any element matching
  `button, input, textarea, select, a[href], summary, [role=button],
  [contenteditable], [tabindex]:not([tabindex="-1"]), [data-keep-focus]`.
  → Mark new modals/panels with `data-keep-focus="true"` on their
  outer container, otherwise the user can't click inside them.
- **`:focus-visible`**: every interactive element should have a visible
  focus ring with `:focus-visible` (not `:focus`) so keyboard users see
  it but mouse users don't.
- **ARIA**: the QueryField is `role="combobox"` with
  `aria-controls=<listbox-id>` + `aria-activedescendant=<option-id>`
  driving the Suggestions listbox. Mirror this pattern for any new
  combobox-style UI.
- **Modals**: use `role="dialog"` + `aria-modal="true"` + `aria-label`
  + a focus trap + focus restoration on close. See `Cheatsheet.jsx` for
  a minimal reference implementation.
- **Live regions**: status info (offline pill, save notifications) goes
  in `aria-live="polite"`.

---

## Build, package, and distribution

### Static (single-file)
```bash
npm run build           # → dist/index.html (one file, ~1.1 MB inlined)
```
Use this for the GitHub release zip and for the `file://` install path.
`vite-plugin-singlefile` inlines every chunk into the HTML, so this
build is *not* friendly to HTTP caching of subcomponents and *cannot*
host a service worker.

### Dev
```bash
npm run dev             # Vite dev server, HMR
```

### Production preview
```bash
npm run build && npm run preview   # serves dist/ at :4173
```

### Hosted (system service for `localhost:8000`)
The `backend/` directory has a Node script + `node-mac/linux/windows`
wrappers that register a system service. See README's "Hosted"
section.

Roadmap Phase 6 will add a `build:hosted` profile that *doesn't* use
singlefile, so chunked output and a service worker become possible.

---

## Performance notes and pitfalls

### The singlefile build inlines lazy chunks
`React.lazy()` still helps with React-level execution scheduling
(deferred render, Suspense boundaries) but the JS for the lazy chunks
is **already in the HTML** and parsed at boot. Don't expect
`React.lazy()` to defer download cost in the static build. In the
hosted build it will (Phase 6).

### Heaviest non-essential chunks
- `react-markdown` (~40 KB gzipped) — only used by `AIcompletion`
- `@mui/joy` + `@emotion/{react,styled}` (~150 KB combined) — only used
  by Settings + MacrosEditor
- `framer-motion` (~80 KB) — used app-wide
- `colorjs.io` (~10 KB) — only used for APCA contrast in Settings

### Compositor-friendly animation discipline
- Use `transform` + `opacity` instead of `width`/`height`/`top`/`left`
- Use `will-change: transform, opacity` on elements that animate every
  frame (added in Phase 1 to Card.plate, Card.logo, QuickLook label)
- **Don't animate SVG `d` attributes** if the same effect can be done
  with cross-faded path snapshots (Roadmap Phase 7)

### Settings persistence
Writes to localStorage are debounced (150 ms) and flushed on
`pagehide` / `beforeunload`. Don't add a synchronous `localStorage.setItem`
on every keystroke — go through `SetSettingsContext` so the debounce
applies.

### Selector-based context
`createOptimisedContext` lets components subscribe to a *slice* of the
store without re-rendering on every store change. Always use
`useStateSelector(s => s.field)` rather than reading the full state —
otherwise typing one character causes a global re-render storm.

### Search-result caching: there is none
Every keystroke fires a fresh autocomplete request to Google. There is
no LRU / sessionStorage cache. If you want one, the cleanest place is
inside `useSuggestions` — wrap `autoCompleteEngine(query, locale)` with
a small Map keyed by `query+locale`.

---

## Where to add common features

| Feature                                       | Where                                                                              |
| --------------------------------------------- | ---------------------------------------------------------------------------------- |
| New keyboard shortcut                         | `QueryField.jsx onKeyDown` (search-related) or `App.jsx onKeyDownRef` (app-wide). Add a row to `Cheatsheet.jsx SECTIONS`. |
| New setting                                   | Add to `settings/settings.js`. Read via `useContext(SettingsContext).<path>`. |
| New panel / modal                             | Create `src/components/<Name>/`. Lazy-import from `App.jsx` (or from inside Settings). Mark outer with `data-keep-focus="true"`. Use `:focus-visible` for focus rings. |
| New macro / engine                            | Edit `public/config.js` (default), or use the in-app `MacrosEditor` (per-user). |
| New AI provider                               | Add preset to `PROVIDER_DEFAULTS` in `AIcompletion.jsx`; if its URL shape differs, extend `buildUrl` in `createCompletion.js`. Add the option to `query.AI.provider` in `settings/settings.js`. |
| New theme variable                            | Add to a theme entry in the settings template. Use it in CSS as `var(--newVar)`. |
| New corner button                             | `<LayoutButton id="..." style={{ corner }} onClick={...} aria-label="...">`. Pass an icon as children. |
| New autocomplete source                       | Edit `useSuggestions.js`. Either add a parallel fetch alongside autocomplete/currency, or create a new engine and pass it as the second arg to `useSuggestions`. |
| New CSS animation                             | Use CSS modules. Prefer transform/opacity. Add `will-change` if it's per-frame. Wrap in `@media (prefers-reduced-motion: reduce)` if disruptive. |
| New URL-template macro command                | Templates use `{@}` (parsed query / macro URL) and `{$}` (raw query / command argument). See `useParseQuery.js`. |

---

## Testing (or lack thereof)

There are no tests. Roadmap Phase 13 introduces Vitest + React Testing
Library, with smoke tests for: search submit, suggestion cycling,
settings save/load, LLM provider guardrail, Esc-once / Esc-twice reset,
macros editor round-trip, offline indicator transitions.

When you add new behavior, **document the manual repro steps** in your
commit message until tests land. The patterns I use:

- Type into the field, hit Enter → expect navigation
- Hit `?` on a blank field → expect cheatsheet
- Open Settings → AI → set provider=Ollama, leave fields blank → type a
  query, double-space → expect the "AI not configured" hint, **no**
  network request to localhost
- DevTools → Network → throttle to Offline → type a query → expect
  history-only suggestions, no errors thrown, offline pill visible
- Open `MacrosEditor`, paste `{"macros":[{"url":"javascript:alert(1)"}]}`,
  hit Save → expect the validation error and **no** save
