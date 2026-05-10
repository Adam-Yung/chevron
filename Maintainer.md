# Chevron — Maintainer Guide

A working tour of the codebase for anyone about to make changes.

For what the project does, see [README.md](./README.md). For the roadmap of planned and shipped improvements, see [Roadmap.md](./Roadmap.md). This document covers how the codebase is organized and where to make changes.

---

## Table of Contents

- [Tech stack](#tech-stack)
- [Directory map](#directory-map)
- [Boot sequence](#boot-sequence)
- [Core data flow](#core-data-flow)
- [State management](#state-management)
- [Settings system](#settings-system)
- [Macros / commands / engines](#macros--commands--engines)
- [Theming](#theming)
- [Animations](#animations)
- [Networking and offline behavior](#networking-and-offline-behavior)
- [AI completion](#ai-completion)
- [Accessibility](#accessibility)
- [Build and distribution](#build-and-distribution)
- [Performance notes](#performance-notes)
- [Where to add common features](#where-to-add-common-features)
- [Testing](#testing)

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | React 18 | Uses `useSyncExternalStore`. React 19 migration deferred. |
| Build | Vite 5 + `vite-plugin-singlefile` | Static build inlines everything into one HTML file. |
| Animation | Framer Motion 11 | Page transitions, panels, chevron morph. |
| UI primitives | MUI Joy (alpha) | Only inside Settings + MacrosEditor. Main UI is hand-rolled CSS modules. |
| Markdown | Custom renderer | 150-line streaming-safe renderer (replaced `react-markdown`). |
| Color math | Custom OKLCH + APCA helper | Replaced `colorjs.io`. |
| Carousel | `@splidejs/react-splide` | Powers the MacrosMenu card slider. |
| Search index | `minisearch` | History suggestion indexing. |
| Color picker | `react-colorful` | Inside Settings. |
| Inline SVG | `react-inlinesvg` | For macro icons from `public/icons.js`. |

No test framework yet — Vitest + React Testing Library is planned in Phase 13.

---

## Directory Map

```
chevron/
├── README.md                  ← user-facing documentation
├── Roadmap.md                 ← phased improvement plan
├── Maintainer.md              ← you are here
├── package.json
├── vite.config.js             ← build config (static + hosted profiles)
├── index.html                 ← entry HTML with inline coloration script
├── public/
│   ├── config.js              ← bundled CONFIG (macros / commands / engines)
│   ├── icons.js               ← bundled ICONS (SVG strings)
│   ├── font.css               ← @font-face for local TTFs
│   └── fonts/                 ← Onest TTFs
├── settings/
│   └── settings.js            ← settings schema (types + defaults)
├── backend/                   ← optional Node service for localhost install
│   ├── server.cjs
│   └── register.cjs
└── src/
    ├── main.jsx               ← entry: applies persisted CONFIG, mounts <App>
    ├── App.jsx                ← root layout, mode switching, modals
    ├── App.css / App.module.css
    ├── rules.js               ← key/mode → component dispatch table
    ├── currencies.js          ← ISO currency codes (autocomplete guard)
    ├── chatGPT/
    │   ├── createCompletion.js  ← provider-agnostic SSE streaming client
    │   └── Icon.jsx
    ├── autocomplete/
    │   └── googleAutocomplete.js  ← JSONP-style fetch
    ├── classes/
    │   ├── miniStore.js         ← pub/sub store (powers createOptimisedContext)
    │   ├── parsedQuery.js       ← query → URL transformation result
    │   └── localStorage/
    │       ├── history.js       ← search history + minisearch index
    │       └── config.js        ← versioned macros override loader
    ├── components/
    │   ├── ActiveElements/      ← background visuals (chevron, marquee, time, quicklook)
    │   ├── AIcompletion/        ← lazy-loaded AI response panel
    │   ├── Card/                ← search-result card (post-redirect animation)
    │   ├── Cheatsheet/          ← keyboard cheatsheet modal
    │   ├── Chevron/             ← the animated chevron logo
    │   ├── ErrorBoundary/       ← top-level error boundary
    │   ├── InteractiveBackground/  ← CSS marquee strip
    │   ├── LayoutButton/        ← corner buttons (settings, cheatsheet, macros)
    │   ├── MacrosEditor/        ← in-app config editor (tabbed)
    │   ├── MacrosMenu/          ← swipeable macros card carousel
    │   ├── Notification/        ← toast notifications
    │   ├── OfflineIndicator/    ← bottom-left offline pill
    │   ├── QueryField/          ← the central input + all key handling
    │   ├── QuickLook/           ← inline preview
    │   ├── Settings/            ← lazy-loaded MUI Joy settings panel
    │   ├── Suggestions/         ← ARIA combobox option list
    │   ├── TextareaAutosize/    ← auto-growing textarea
    │   ├── Time/                ← clock widget
    │   └── TransitionController/ ← animation lifecycle wrapper
    ├── contexts/
    │   ├── Settings.jsx         ← settings + theme + colorScheme providers
    │   ├── Store.jsx            ← per-session ephemeral state
    │   └── createOptimisedContext.jsx  ← selector-friendly context factory
    ├── functions/
    │   ├── getMacro.js          ← query → matching macro lookup
    │   ├── animUtils/           ← easings, animation scheduler
    │   ├── dataUtils/           ← copyObj, propertyByPath, pseudoHash, etc.
    │   ├── generationUtils/     ← getClasses, color helpers, gradient util, formatDate, renderMarkdown
    │   └── webUtils/            ← URL helpers, fetchFromScriptTag, isMobile
    └── hooks/
        ├── useColorSchemeDetector.js
        ├── useIsKeyPressed.js
        ├── useOnlineStatus.js
        ├── useParseQuery.js     ← query → ParsedQuery (URL + display)
        ├── useRedirect.js       ← location.assign with fade-out
        ├── useSuggestions.js    ← merges autocomplete + history + converters
        └── useTransitions.js
```

---

## Boot Sequence

1. `index.html` runs an inline `<script>` that reads `localStorage.settings` and sets the document background color **before** React loads (prevents color flash).
2. `<script src="config.js">` and `<script src="icons.js">` set `window.CONFIG` and `window.ICONS` synchronously.
3. `src/main.jsx` runs:
   - `applyPersistedConfigToWindow()` — replaces `window.CONFIG` with the user's saved version if one exists
   - Renders `<ErrorBoundary><SettingsProvider><StoreProvider><App/>`
4. `App.jsx` registers global key/mouse listeners, picks the layout, and mounts the cheatsheet + offline indicator.

If you need something at boot (polyfill, new context, window-level side effect), `main.jsx` is the place.

---

## Core Data Flow

```
user types → window 'keypress' event
                 ↓
QueryField.onKeyPress → focus input, double-space → setAiQuery
                 ↓
<input onChange> → handleQueryChange → updateStore({ query, mode })
                 ↓
useStateSelector picks up new query
                 ↓
useSuggestions(query) → autocomplete + history + converters in parallel
                 ↓
useParseQuery(query) → resolve macro/command, build URL → parsedQuery
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

**Key fact:** The QueryField is the always-focused root of all keyboard input. A `mousedown` handler re-focuses the input unless the click was on an interactive element or inside `[data-keep-focus]`. Mark new panels/modals with `data-keep-focus="true"` on their outer container.

---

## State Management

Two systems:

### 1. SettingsProvider (`src/contexts/Settings.jsx`)

Persistent user preferences. Read via `useContext(SettingsContext)`, write via `useContext(SetSettingsContext)`. Persists to `localStorage["settings"]` with 150 ms debounce + flush on `pagehide`/`beforeunload`.

Also exports:
- `ThemeContext` — active theme color tokens
- `ColorSchemeContext` — `light` | `dark` | `auto`

### 2. StoreProvider (`src/contexts/Store.jsx`)

Ephemeral per-tab state using `createOptimisedContext` (wraps a pub/sub `MiniStore` so components subscribe to slices without re-rendering on every change).

Fields: `mode`, `query`, `selectedSuggestion`, `redirected`, `timestamp`

Hooks:
- `useStateSelector(s => s.field)` — subscribe to a slice
- `useUpdate()` — partial update respecting `redirected`
- `useReset()` — full store reset

**Rule:** Persistent app state → Settings. Per-session UI state → Store.

---

## Settings System

`settings/settings.js` is the source of truth:

```js
{
  template: { ...defaultSettings },     // default tree
  hidden: [ 'category', ... ],          // categories behind the eye toggle
  types: { Input, List, Number, ... }   // type constructors for the editor
}
```

To add a new setting:
1. Pick a category (or create one) in `settings/settings.js`
2. Use a type constructor: `new types.Input(default, placeholder)`, `new types.List(default, options)`, etc.
3. Read it via `useContext(SettingsContext).<category>.<field>`
4. The Settings panel auto-renders an editor for it

To add a new editor type (e.g. date picker), add it to `src/components/Settings/Property/Property.jsx` and to the `types` export.

---

## Macros / Commands / Engines

### Bundled defaults (`public/config.js`)

Sets `window.CONFIG = { macros, commands, engines }` synchronously before React. Edit this to ship new default macros.

### User overrides (`src/classes/localStorage/config.js`)

```js
loadConfig()        // reads localStorage, validates, falls back to bundled
saveConfig(next)    // validates URLs, writes localStorage, mirrors to window.CONFIG
resetConfig()       // drops override, restores bundled
applyPersistedConfigToWindow()  // boot helper called from main.jsx
```

**URL-scheme guardrail:** `findForbiddenUrls()` rejects `javascript:`, `data:`, `vbscript:`, `file:` anywhere in the tree. Invalid configs fall back to bundled with a warning.

Consumers of `window.CONFIG`:
- `getMacro.js` — query → matching macro
- `MacrosMenu.jsx` — pinned macros display
- `useParseQuery.js` — engine + macro URL templating
- `settings/settings.js` — engine list for the picker

---

## Theming

`SettingsProvider` writes theme values to the document root as CSS custom properties:

```js
document.documentElement.style.setProperty('--' + variable, theme[variable])
```

Use `var(--primary)`, `var(--secondary)`, `var(--query)`, `var(--accent)`, etc. in CSS.

The pre-React inline script sets the body background from persisted settings so there's no flash of wrong color on load.

`useColorSchemeDetector` picks `light`/`dark` based on `prefers-color-scheme` when set to `auto`.

---

## Animations

- **Framer Motion** — page transitions and modals (`AnimatePresence`, `motion.div`)
- **CSS modules** — hover/state transitions. Use explicit `transition: opacity 200ms` (not `transition: all`). Add `will-change: transform, opacity` on per-frame animated elements.
- **`prefers-reduced-motion`** — respected globally in `App.css` and per-component

The chevron SVG morph animates the `d` attribute directly. It's cheap enough for the simple bezier paths involved.

---

## Networking and Offline Behavior

All fetches must degrade gracefully offline:

- **`fetchFromScriptTag`** (JSONP autocomplete): `script.onerror` + 5 s timeout + DOM cleanup
- **`useSuggestions`**: each fetch wrapped in `.catch()`; failures logged, UI still renders
- **`AIcompletion`**: errors display in the panel as formatted text (never crashes the app)
- **`useOnlineStatus`**: `useSyncExternalStore` over `online`/`offline` events → drives the offline pill

When adding a new fetch:
1. Use `AbortController` + a timeout
2. Wrap in `try/catch`, either log+ignore or surface in the UI
3. Never crash the app on network failure
4. Always resolve/reject within the timeout (no infinite spinners)

---

## AI Completion

Provider-agnostic OpenAI v1 schema. Configured in Settings → Query → AI.

Code path:
1. `AIcompletion.jsx` → `resolveProviderConfig(aiSettings)` → returns `{ provider, config, missing }`. If `missing` is non-null, shows hint and **doesn't fire**.
2. `createCompletion(setCompletion, messages, temperature, providerConfig)` opens an SSE stream and pipes chunks via `dataParser`.
3. `errorParser` handles OpenAI's `{error:{message}}`, Ollama's `{error}`, and non-JSON bodies.
4. Output rendered via the custom markdown renderer.

To add a new provider: edit `PROVIDER_DEFAULTS` in `AIcompletion.jsx`, extend `buildUrl()` in `createCompletion.js` if needed, add the option to `query.AI.provider` in `settings/settings.js`.

---

## Accessibility

- **Focus management**: `mousedown` handler in `QueryField.jsx` re-focuses the input but skips interactive elements and `[data-keep-focus]` subtrees. Mark new modals with `data-keep-focus="true"`.
- **`:focus-visible`**: all interactive elements have visible focus rings for keyboard users only.
- **ARIA combobox**: QueryField is `role="combobox"` with `aria-controls` + `aria-activedescendant` driving the Suggestions listbox.
- **Modals**: `role="dialog"` + `aria-modal="true"` + `aria-label` + focus trap + focus restoration. See `Cheatsheet.jsx` for reference.
- **Live regions**: status updates (offline pill, save notifications) use `aria-live="polite"`.

---

## Build and Distribution

### Static (single-file)
```bash
npm run build           # → dist/index.html (~1 MB inlined)
```
For the GitHub release zip and `file://` installs. `vite-plugin-singlefile` inlines all chunks, so this build can't use HTTP caching or service workers.

### Hosted (multi-chunk)
```bash
npm run build:hosted    # → dist/ with hashed filenames
```
For HTTP servers and GitHub Pages. Enables lazy-loading benefits and future PWA support.

### Dev
```bash
npm run dev             # Vite dev server with HMR
npm run preview         # serves the production build at :4173
```

### System service (localhost:8000)
The `backend/` directory has a Node script + `node-mac/linux/windows` wrappers that register a system service. See the README's local server section.

---

## Performance Notes

**Singlefile build inlines lazy chunks.** `React.lazy()` still helps with execution scheduling (deferred render, Suspense boundaries) but all JS is parsed at boot. True download deferral only works in the hosted build.

**Heaviest chunks:**
- `framer-motion` (~80 KB) — used app-wide
- `@mui/joy` + `@emotion` (~150 KB) — only Settings + MacrosEditor
- `@splidejs` (~25 KB) — only MacrosMenu

**Compositor discipline:**
- Use `transform` + `opacity`, not `width`/`height`/`top`/`left`
- Use `will-change: transform, opacity` on per-frame elements
- Don't animate SVG `d` attributes when cross-fading would work (though it doesn't here — see Phase 7)

**Settings persistence:** Goes through `SetSettingsContext` with 150 ms debounce. Never write `localStorage.setItem` directly on keystroke.

**Selector-based context:** Always use `useStateSelector(s => s.field)` — reading the full state causes a global re-render storm on every keystroke.

**No autocomplete cache:** Every keystroke fires a fresh request. If you want caching, wrap `autoCompleteEngine(query, locale)` in `useSuggestions` with a small Map.

---

## Where to Add Common Features

| Feature | Where |
|---|---|
| New keyboard shortcut | `QueryField.jsx onKeyDown` (search) or `App.jsx onKeyDownRef` (global). Add row to `Cheatsheet.jsx SECTIONS`. |
| New setting | `settings/settings.js` → read via `useContext(SettingsContext).<path>` |
| New panel / modal | `src/components/<Name>/`, lazy-import from `App.jsx`, mark `data-keep-focus="true"` |
| New macro / engine | `public/config.js` (bundled default) or in-app MacrosEditor (per-user) |
| New AI provider | `PROVIDER_DEFAULTS` in `AIcompletion.jsx` + `buildUrl` in `createCompletion.js` + settings option |
| New theme variable | Add to theme entry in settings template, use as `var(--newVar)` in CSS |
| New corner button | `<LayoutButton>` with icon, position, and `aria-label` |
| New autocomplete source | `useSuggestions.js` — add a parallel fetch or new engine |
| New CSS animation | CSS modules, prefer transform/opacity, add `will-change`, wrap in `@media (prefers-reduced-motion)` |
| New URL template variable | Templates use `{@}` (parsed URL) and `{$}` (raw argument). See `useParseQuery.js`. |

---

## Testing

There are no automated tests yet (Phase 13). When adding behavior, document manual repro steps in your commit message:

- Type + Enter → expect navigation
- `?` on blank field → cheatsheet opens
- Settings → AI → Ollama with blank fields → double-space → "AI not configured" hint, no network request
- DevTools → Offline → type → history-only suggestions, no errors, offline pill visible
- MacrosEditor → paste `{"macros":[{"url":"javascript:alert(1)"}]}` → Save → validation error, no save
