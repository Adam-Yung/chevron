# Macro Menu Redesign

> Long-form planning document for Phase 8 (working title: **Reimagined macro
> mode**). Authored so a fresh-context Claude session can pick up and execute
> end-to-end without re-deriving the design.
>
> Author note (2026-05-05): this is a **planning artifact only**. No code in
> the repo is touched by this commit. Implementation is broken into commits
> 8a → 8e per the plan below.

---

## 0. TL;DR

The macro menu currently piggybacks on the search-mode state machine, which
creates two overlapping UIs (menu + suggestions stack) and makes "shift to
toggle" ambiguous with "shift to peek". This phase:

1. **Decouples macro mode from search mode** with a new `macro` mode and a
   new `macroFilter` slice in the store, completely independent of `query`.
2. **Reimagines the macro menu** as a modern, touch-first grid with
   Framer-Motion stagger entrances, search-as-you-type filter overlay, and
   compositor-only animations.
3. **Fixes the clock** (root cause: re-mount churn on mode transitions) and
   adds an **OpenWeatherMap widget** to its right with graceful no-key
   fallback.
4. **Adds a gesture system** (swipe up = open, swipe down = close, swipe
   left/right inside menu = paginate) that's **opt-in by default on
   desktop**, automatic on touch devices.
5. Carves out roadmap entries for **calculator + currency / weight / time
   converters** as future engine-typed inputs.

The user's vision is endorsed with **three pushbacks** captured below
(§ 2). The implementation is broken into five commits (§ 8) so each can be
reverted independently.

---

## 1. Problem statement

### 1.1 Bugs the user reported

- **Macro menu and search stack visually**: with the menu open, typing
  causes `query` to populate, which trips the `query → searching` reducer
  in `Store.jsx:44-47`, which tries to play the *opened → searching*
  transition (which doesn't exist in `Chevron.jsx`'s transition table),
  leaving both UIs visible simultaneously.
- **Shift again doesn't fully close**: keydown opens, but a second
  Shift while in `opened` mode currently triggers the keyup-close path
  *and* the `peekingRef`-was-false branch, so visual state desyncs.
  The recent fix (using `modeRef`) solved the keyup-stale-closure case
  but did not address "Shift while already opened via button".
- **Clock doesn't tick** while the menu is visible. Time.jsx's recursive
  setTimeout is correct (line 38-43), but `MacrosMenu` is wrapped in a
  `Suspense` boundary mounted from `Chevron.jsx:313-317`, and the
  surrounding `<motion.div>` exit animation can unmount Time. Also,
  `useEffect([])` won't re-fire when the parent flickers in/out of
  Suspense.
- **Right-click toggles** (currently `switchMacrosMenu` in App.jsx:62) but
  user wants right-click to be a destructive close, not a toggle.

### 1.2 What the user wants

(quoting their own framing, condensed)

- Pressing Shift, Esc, or right-click while macro mode is active = **full
  reset to default**.
- **Hold-Shift** opens the menu and lets the user type to filter while held;
  release = close.
- **Tap-Shift** also opens (keep current peek behavior) but typing inside
  goes to the filter, not the QueryField.
- **Filter input is decoupled from QueryField**. Typed character replaces
  the clock display ("typing buffer" indicator); MacrosMenu narrows in
  realtime.
- **Weather widget** to the right of the clock; no API key → hide widget
  and recenter clock.
- **Gestures**: swipe up = open, swipe down = close; left/right swipe in
  menu paginates; trackpad scroll wheels through pages.
- **Touch first-class**: on-screen keyboard only when needed; bigger hit
  targets.
- **Roadmap**: currency / weight / time converters + calculator.
- "Make it modern, stylish, beautiful."

---

## 2. Pushback / agreement / improvements

The user explicitly invited critique. Here it is:

### 2.1 Endorsed

- ✅ **Decoupling macro mode from search**. Critical correctness fix; the
  current dual-UI is genuinely a bug.
- ✅ **Right-click = destructive close**. A toggle is what almost every
  context-menu-disabling site does and it's surprising for a destructive
  control. Match user expectation.
- ✅ **Filter typing decoupled from QueryField**. The right design.
- ✅ **Weather + clock in same row, hide gracefully when unconfigured.**
- ✅ **Trackpad scroll = paginate** in menu. Splide already does this
  (`wheel: true` in `MacrosMenu.jsx:90`); just ensure it's wired into the
  redesigned grid.
- ✅ **Calculator / converters in Roadmap.** They're already partially
  there (currency exists as an engine type); formalize.

### 2.2 Pushback (3 items)

#### 2.2.1 ✋ Hold-Shift to type is broken on the OS level

Shift is a **modifier**: holding it down means every typed character
arrives as the **shifted variant**. Try holding Shift and typing "google"
— you get "GOOGLE", which is a poor filter UX (you'd have to lowercase
client-side). It also breaks any macro whose name has a dash, comma, or
slash (those become `_`, `<`, `?` while held).

**Counter-proposal**: two interaction modes, both first-class:

- **Tap-Shift** (release within ~300ms, no other key): toggles macro
  mode persistently. Type freely without modifiers. Press Shift / Esc /
  right-click again to close.
- **Hold-Shift** (Shift held while another non-modifier key arrives):
  pure peek mode. Filter buffer disabled while holding. Release = close.
  This is the existing keyboardist's "show me the shortcuts" behavior
  and *should* stay snappy.

This separates "I want to look up a macro hotkey" (peek) from "I want to
search and pick a macro by name" (toggle). The user's spec is achievable
but the typing-while-held path is much weaker than typing-after-tap.

**If the user insists on hold-Shift typing**, the workaround is:
strip the shift modifier before matching the typed key against the
filter buffer. Implementable; it's a footnote, not a blocker.

#### 2.2.2 ✋ 7-day forecast is a lot of pixels

The clock + weather sit in the **top wrapper** of `Chevron.jsx`, which
animates open/closed. Seven daily cells + icons + temps could easily
dwarf the clock and make the chrome visually cluttered.

**Counter-proposal**: today-only by default (icon + current temp + hi/lo);
expand to a 5-day strip on hover (desktop) or tap (touch). This matches
how weather chips work on iOS / Android lock screens.

If the user really wants 7-day always-visible, fine — but flag it as a
density issue and provide a "compact / expanded" setting under
Appearance.

#### 2.2.3 ✋ Touch as "first-class citizen" on a desktop startpage

This is a tractable scope question, not a design objection. Phase 10
(Mobile / touch first-class) is already on the roadmap. Today, mobile
visitors see a "not supported" banner with an `ignoreMobile` localStorage
escape hatch (`App.jsx:22, 235-245`).

**Counter-proposal**: Phase 8 ships gestures **on the existing desktop
flow** (so trackpad users benefit immediately), and explicitly **does
NOT** lift the mobile banner. Lifting the banner is Phase 10's job and
needs viewport / safe-area / on-screen-keyboard work that's separate
from "make the macro menu touch-friendly".

Concretely: gestures land in Phase 8; mobile-as-supported lands later.

### 2.3 Suggested improvements (additive)

- **Filter algorithm = MiniSearch** (3 KB gzipped) over name + triggers +
  category, with prefix and fuzzy. The current
  `pinnedMacros.indexOf(macro)` and per-keypress hotkey loop in
  `MacrosMenu.jsx:64-74` is fine for the existing button-based flow
  but is too crude once we have a typing filter.
- **Filter buffer indicator**: instead of replacing the clock with the
  raw typed string, show a pill above the clock with the filter +
  "n results". Keep clock visible. This is more legible than swapping
  the clock contents in/out.
- **Weather caching**: OpenWeatherMap free tier is rate-limited (60
  calls/min, 1M/month). Cache the response in a `LocalStorageObject`
  with a TTL of 10 minutes for current weather, 1 hour for forecast.
  Survives page reloads + offline.
- **Geocoding instead of bundling a city library**: OpenWeatherMap
  ships a `/geo/1.0/direct?q={city}` endpoint that returns lat/lon
  for free. No need to bundle anything. Lazy-load a city autocomplete
  only when the settings tab is opened.
- **Animate the menu open with stagger** (Framer Motion's
  `staggerChildren`) so cards cascade in. Pure transform/opacity =
  compositor-only, fits Phase 7's mandate.
- **`prefers-reduced-motion`**: any new animation must respect it.
  Existing pattern in `App.css` does the heavy lifting; new components
  must opt in to the same `@media (prefers-reduced-motion: reduce)`
  rule.
- **Don't leak the gesture system into `App.jsx`**. Extract it into a
  `useGestures` hook so `App.jsx` stays a layout file.

---

## 3. Architecture

### 3.1 New mode: `macro`

`src/rules.js` becomes:

```js
const allowedModes = new Map([
  ['QueryField', new Set(['default', 'searching'])],
  ['Chevron',    new Set(['default', 'opened', 'macro'])],   // + macro
  ['Suggestions',new Set(['searching'])],
  ['Slider',     new Set(['opened', 'macro'])],              // + macro
  ['MacroFilter',new Set(['macro'])],                        // new actor
])
```

`Store.jsx`:

- Add `macroFilter: ''` to `InitialStore`.
- `useUpdate` already auto-recomputes `mode` from `query` (line 44-47).
  Add a parallel rule:

  ```js
  if ('macroFilter' in partialNewState) {
    // typing in macro mode never leaves macro mode
    // pure filter update, mode untouched
  }
  if ('mode' in partialNewState && partialNewState.mode !== 'macro') {
    newState.macroFilter = ''           // closing macro mode resets filter
  }
  ```

- `useReset` already nukes everything (returns a fresh `InitialStore`).
  Use it for the right-click / Esc / Shift-while-open paths.

### 3.2 Existing `opened` mode → renamed `macro`?

**Decision: keep `opened` as the legacy alias and add `macro` as the
canonical name** for one phase, then deprecate `opened` in Phase 8b.

Rationale: `opened` is sprinkled across `Chevron.jsx`, `MacrosMenu.jsx`,
`useStateSelector` consumers, and the Splide `keyboard: 'global'` gate.
A single rename is fine — but staging it as alias-then-rename keeps the
diff per commit small and bisectable.

Actually, on reflection: the rename adds churn for zero behavioral
benefit. **Drop the rename**; keep using `opened`. The "macro" naming
shows up only in the *new* slice (`macroFilter`) and the new gesture
hook. Existing `mode === 'opened'` checks stay as-is.

**Final**: don't rename. Add `macroFilter` next to `mode`. Done.

### 3.3 Component map (new + changed)

```
src/
├── App.jsx                              [MOD] gesture wiring, key handling,
│                                              right-click = reset
├── components/
│   ├── Chevron/
│   │   └── Chevron.jsx                  [MOD] top wrapper hosts
│   │                                          ChevronTop (clock+weather);
│   │                                          MacrosMenu gets filter prop
│   ├── ChevronTop/                      [NEW] composes clock + weather
│   │   ├── ChevronTop.jsx
│   │   └── ChevronTop.module.css
│   ├── Time/
│   │   └── Time.jsx                     [MOD] guard against unmount churn
│   ├── Weather/                         [NEW] lazy chunk
│   │   ├── Weather.jsx
│   │   ├── Weather.module.css
│   │   └── weatherCache.js              [NEW] LocalStorageObject TTL cache
│   ├── MacrosMenu/
│   │   ├── MacrosMenu.jsx               [MOD] accept filter, MiniSearch,
│   │   │                                      stagger animation,
│   │   │                                      bigger hit targets
│   │   └── MacrosMenu.module.css        [MOD] grid + touch sizing
│   ├── MacroFilterPill/                 [NEW] floating filter indicator
│   │   ├── MacroFilterPill.jsx
│   │   └── MacroFilterPill.module.css
│   └── QueryField/
│       └── QueryField.jsx               [MOD] disable focus grabber while
│                                              mode === 'macro'
├── hooks/
│   ├── useGestures.js                   [NEW] swipe / wheel detector
│   └── useMacroFilter.js                [NEW] keypress → store.macroFilter
├── functions/
│   └── webUtils/
│       └── openWeather.js               [NEW] fetch wrappers w/ AbortCtrl
└── settings/
    ├── settings.js                      [MOD] + weather, + clockFormat
    └── settingTypes.jsx                 [MOD] (no changes expected)
```

---

## 4. Detailed designs

### 4.1 Mode + key handling

```
┌────────────────────────────────────────────────────────────────────┐
│ EVENT                  STATE TRANSITION              FILTER ACTION  │
├────────────────────────────────────────────────────────────────────┤
│ Tap-Shift (default)    default  → opened             clear          │
│ Tap-Shift (opened)     opened   → default            clear          │
│ Hold-Shift (default)   default  → opened (peek)      DISABLED       │
│ Release-Shift (peek)   opened   → default            clear          │
│ Esc (opened)           opened   → default            clear          │
│ Esc (opened, filter)   opened, filter ≠''           pop last char   │
│ Esc (opened, no filter)opened   → default            (n/a)          │
│ Right-click (any)      mode     → default            clear          │
│ Letter key (opened)    opened   → opened             append char    │
│ Backspace (opened)     opened   → opened             pop last char  │
│ Letter key (default)   default  → searching          (QueryField)   │
└────────────────────────────────────────────────────────────────────┘
```

**Tap vs hold detection**: track `shiftDownAt = performance.now()` on
keydown; on keyup with `(now - shiftDownAt) < 250 && noOtherKeyArrived`,
classify as tap. If the user typed any non-modifier key while Shift was
held, treat as hold-peek (release closes).

This mirrors macOS / iPad's "globe key" double-personality and is
familiar enough to need no documentation.

**Right-click**: `App.jsx:111-114` currently calls
`switchMacrosMenu()` which toggles. Change to:

```js
onContextMenuRef.current = e => {
  if (mode === 'default') updateStore({ mode: 'opened' })
  else                    resetStore()      // any other mode = full reset
  e.preventDefault()
}
```

### 4.2 Filter input plumbing

`useMacroFilter` hook:

```js
function useMacroFilter() {
  const mode = useStateSelector(s => s.mode)
  const filter = useStateSelector(s => s.macroFilter)
  const updateStore = useUpdate()

  useEffect(() => {
    if (mode !== 'opened') return
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Backspace') {
        e.preventDefault()
        updateStore({ macroFilter: filter.slice(0, -1) })
        return
      }
      if (e.key.length === 1 && /[\p{L}\p{N}\s\-_.]/u.test(e.key)) {
        e.preventDefault()
        updateStore({ macroFilter: filter + e.key.toLowerCase() })
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mode, filter, updateStore])
}
```

Mounted from `App.jsx` once, after the existing keydown listener. The
existing `?`-opens-cheatsheet handler stays put (Shift+/ = `?` is fine
since the filter regex doesn't accept `?`).

**QueryField focus grabber must yield**: add `mode === 'macro' || mode
=== 'opened'` to the early-return in `QueryField.jsx:164-171`. Otherwise
the input snatches focus back and the QueryField's `keypress` handler
ALSO sees the typed letter (double-handling).

Actually, simpler: while in `opened` mode, mount a `<div data-keep-focus
tabIndex={-1}>` wrapper around the menu and call `.focus()` on it on
mode entry. The existing `[data-keep-focus]` plumbing already handles
the rest.

### 4.3 MacrosMenu redesign

Visual targets:

- **Grid** of cards (current Splide layout retained for pagination
  benefit, but card visuals refreshed).
- **Card hit target**: min 56×56 CSS px (Apple HIG = 44pt, Material =
  48dp; both fine).
- **Glassmorphic backdrop** behind the grid: `backdrop-filter: blur(16px)
  saturate(1.6)`; falls back to solid `background: theme.menuBg` when
  not supported.
- **Stagger entrance**: `motion.ul` with `variants={ container }`,
  `motion.li` with `variants={ item }`. ~30ms stagger; total ≤ 200ms.
- **Filter dim**: matched cards `opacity: 1`; unmatched
  `opacity: 0.25 + transform: scale(0.95)`. CSS-only via a
  `data-match="true|false"` attribute. No layout shift.
- **Empty state**: filter that matches nothing shows a centered "no
  matches for {filter}" message.

Hotkey-on-card hint stays (current `Card` component already does
`isHintActive` from `isShiftPressed`); this is the "peek" feature and
it's good.

Splide config additions:

- `breakpoints` with smaller `cols` on narrow viewports (groundwork
  for Phase 10 mobile work; safe to add now).
- `wheel: true` is already on. Verify it survives the redesign.

### 4.4 Time.jsx fix

The current code:

```js
useEffect(() => {
  setTime(new Date())
  updateTime(setTime, timerRef)
  return () => clearTimeout(timerRef.current)
}, [])
```

is correct. The bug is that `MacrosMenu`'s `<motion.div>` parent
(`Chevron.jsx:309-319`) and the wrapping `<Suspense>` cause Time to
**unmount** when the menu animates closed (because `MacrosMenu` itself
unmounts). But Time doesn't live inside MacrosMenu — it's in the **top
wrapper** at `Chevron.jsx:284-290`. So why the report?

Hypothesis: `Chevron.jsx:152` calls `setIsMacrosMenuRendered(false)`
during the opened→default transition, which triggers a Chevron
re-render, but Time's `useEffect([])` shouldn't refire on parent
re-render. It would only refire if React unmounts Chevron itself.

**Most likely cause**: `App.jsx`'s `<motion.div key={timestamp}>`
(line 195-200) — when `timestamp` changes (which `useReset` does via
`new InitialStore`), the entire Chevron tree unmounts and remounts
with a fresh tree. Each remount restarts the timer, so it *should*
keep ticking. But if `setTime` is called on an unmounted component,
React 18 silently no-ops, and the next remount has stale state.

**Fix**:

1. Use `useSyncExternalStore` against a singleton `timeStore` so the
   timer survives across mounts. One `setInterval(1s)` lives at module
   scope; multiple consumers subscribe.
2. OR: simpler, hoist the timer to a `TimeProvider` that wraps the
   app once, store current time in context, and have Time.jsx just
   `useContext`.

Recommend (1) — no provider boilerplate, and `useSyncExternalStore` is
the canonical React 18 pattern for "external mutable source". Pattern:

```js
// timeStore.js
let now = new Date()
const listeners = new Set()
setInterval(() => {
  now = new Date()
  listeners.forEach(l => l())
}, 1000 - (Date.now() % 1000))   // align to second boundary

export const subscribeTime = l => { listeners.add(l); return () => listeners.delete(l) }
export const getTime = () => now
```

```js
// Time.jsx
const time = useSyncExternalStore(subscribeTime, getTime)
```

The interval lives forever (one per page lifetime). No accidental
re-creation. Survives any unmount.

### 4.5 Weather widget

#### 4.5.1 Settings additions

```js
// settings/settings.js (template additions)
weather: {
  apiKey: new Input({
    default: '',
    description: 'OpenWeatherMap API key. Free tier at openweathermap.org.'
  }),
  city: new Input({
    default: '',
    description: 'City name. Resolved via OpenWeatherMap geocoding once.'
  }),
  lat: new Input({ default: '', description: 'Latitude (auto-filled).' }),
  lon: new Input({ default: '', description: 'Longitude (auto-filled).' }),
  units: new List({
    default: 'metric',
    options: ['metric', 'imperial', 'standard'],
    description: 'Temperature units (Celsius / Fahrenheit / Kelvin).'
  }),
  forecastDays: new Range({
    default: 5,
    min: 0,
    max: 7,
    description: 'How many forecast days to show on hover/tap. 0 = today only.'
  })
}
```

`hidden`: `['weather.lat', 'weather.lon']` — these are auto-filled when
the user hits "Resolve" next to the city input.

Add `weather: FiCloud` to `TAB_ICONS` in `Settings.jsx:40-47`. The new
tab will auto-appear because the sidebar derives tabs from
`Object.keys(settings.template)` (`Settings.jsx:62`).

#### 4.5.2 City resolution

Inside the Weather settings tab, add a "Resolve coordinates" button next
to the city input. On click:

```
GET https://api.openweathermap.org/geo/1.0/direct?q={city}&limit=5&appid={key}
```

Show top-5 hits in a dropdown; on selection, write `lat` / `lon` /
`city` (canonical name) to settings. This is Phase 8d's "lazy-loaded
location autocomplete" without bundling a city database — the API does
it for us.

#### 4.5.3 Weather data fetch

```
GET https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units={units}&appid={key}
GET https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&units={units}&appid={key}
```

(`/onecall` requires OneCall 3.0 paid subscription; the legacy
`/forecast` is free and gives 5-day / 3-hour forecast which we sample
to one entry per day.)

`weatherCache.js` (`LocalStorageObject`):

```js
class WeatherCache extends LocalStorageObject {
  static key = 'chevron.weather'
  // shape: { current: {...,fetchedAt}, forecast: {...,fetchedAt} }
}
```

TTL gates: `Date.now() - fetchedAt < 10*60_000` for current,
`< 60*60_000` for forecast. On cache miss, fetch in background and
serve stale data optimistically.

**Offline behavior**: the existing `useOnlineStatus` (Phase 4) tells
us when not to fetch. Keep showing the cached data with a small "stale"
dot until reconnect.

#### 4.5.4 Layout

```
┌─ Top wrapper (current Time slot) ─────────────────────────────┐
│                                                               │
│   ☀ 18°  ⌃ 22°/14°    │    14:32:05    │   tap → forecast    │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

When `apiKey` empty or settings `weather.city` blank: weather slot
hidden, clock recenters via flexbox `justify-content: center`. CSS
container query so the layout adapts to the chevron's stretched width.

`<ChevronTop>` JSX:

```jsx
<div className={c['top']}>
  {weatherEnabled && (
    <Suspense fallback={null}>
      <Weather />
    </Suspense>
  )}
  <Time />
</div>
```

`weatherEnabled = Boolean(settings.weather.apiKey && settings.weather.lat)`.

Forecast strip on hover (desktop) / tap (touch): a `<motion.div>`
that slides down below the row when active. Click-outside or Esc to
close. `prefers-reduced-motion`: skip the slide.

### 4.6 Gesture system

`useGestures`:

```js
function useGestures({ onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight }) {
  useEffect(() => {
    let startY, startX, startT
    const onTouchStart = e => {
      const t = e.touches[0]
      startY = t.clientY; startX = t.clientX; startT = performance.now()
    }
    const onTouchEnd = e => {
      const t = e.changedTouches[0]
      const dy = t.clientY - startY
      const dx = t.clientX - startX
      const dt = performance.now() - startT
      if (dt > 600) return                                // too slow
      const absX = Math.abs(dx), absY = Math.abs(dy)
      if (Math.max(absX, absY) < 60) return               // too short
      if (absY > absX) {
        dy < 0 ? onSwipeUp?.() : onSwipeDown?.()
      } else {
        dx < 0 ? onSwipeLeft?.() : onSwipeRight?.()
      }
    }
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend',   onTouchEnd,   { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend',   onTouchEnd)
    }
  }, [onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight])
}
```

Wired in `App.jsx`:

```js
useGestures({
  onSwipeUp:    () => mode === 'default' && updateStore({ mode: 'opened' }),
  onSwipeDown:  () => mode !== 'default' && resetStore(),
  // left/right delegated to Splide's own touch handler — don't double-fire
})
```

Splide handles pagination swipes natively; don't intercept those.

**Trackpad horizontal scroll** for pagination: Splide's `wheel: true`
already handles vertical wheel events. For horizontal, Splide's recent
versions accept `wheelMinThreshold` and `wheelSleep` options; if not
sufficient, add a tiny passthrough that converts `wheelDeltaX` to
`splide.go('+' or '-')`.

**Virtual keyboard control**: defer to Phase 10. For Phase 8, the
QueryField stays auto-focused on desktop only. On touch devices,
`isMobile` already shows the not-supported banner; once Phase 10
removes that, the QueryField needs `inputMode="none"` until the user
taps it.

---

## 5. Settings additions (concrete diff sketch)

`settings/settings.js` — add a `weather` category at the same level as
`general`, `appearance`, `chevron`, `query`, `menu`. Order in the
sidebar follows insertion order in the template object.

```js
template: {
  general: {...},
  appearance: {...},
  chevron: {...},
  query: {...},
  menu: {...},
  weather: {
    apiKey:        new Input({ default: '', description: '...' }),
    city:          new Input({ default: '', description: '...' }),
    lat:           new Input({ default: '', description: '...' }),
    lon:           new Input({ default: '', description: '...' }),
    units:         new List({ default: 'metric', options: ['metric', 'imperial', 'standard'], description: '...' }),
    forecastDays:  new Range({ default: 5, min: 0, max: 7, description: '...' }),
  },
  // ai, etc.
},
hidden: [
  'weather.lat',
  'weather.lon',
  // existing hidden entries...
]
```

`settings/settings.js` — also: a new `gestures` group under
`appearance`:

```js
appearance: {
  ...,
  gestures: {
    enableSwipe: new Switch({ default: true, description: 'Swipe up to open the macros menu, swipe down to close.' }),
    enableTrackpad: new Switch({ default: true, description: 'Trackpad scroll paginates the macros menu.' }),
  }
}
```

`Settings.jsx` — `TAB_ICONS`:

```js
const TAB_ICONS = {
  general:   FiSettings,
  appearance:FiLayout,
  chevron:   FiZap,
  query:     FiSearch,
  menu:      FiGrid,
  weather:   FiCloud,
  macros:    FiCommand,
}
```

---

## 6. Bundle impact

Estimated additions (uncompressed, before tree-shake):

| Item                          | Size  | Lazy? |
|-------------------------------|-------|-------|
| `Weather.jsx` + cache + CSS   | ~6 KB | Yes — `lazy(() => import(...))` from `ChevronTop` |
| `MiniSearch` (filter)         | ~10 KB| Yes — lazy from MacrosMenu when filter first used |
| `useGestures` hook            | ~1 KB | No — sits in App.jsx already-eager chunk |
| `MacroFilterPill` + CSS       | ~2 KB | No — small enough |
| Settings additions            | ~1 KB | Already lazy via Settings chunk |

Net first-paint cost: ~3 KB (just the gesture hook + filter pill skeleton).
Weather + filter activation are pay-as-you-go.

Don't bundle a city database. Stays under Phase 6's bundle goals.

---

## 7. `Roadmap.md` additions

Append to "Additional ideas" (or promote to phases later):

```markdown
### Phase 8 — Macro mode reimagined  `[ ]`

User-facing: type-to-filter macros menu, weather widget, gestures,
clock fix. See `Macro_menu_redesign.md` for the spec.

Sequencing interleaves Phase 7 between 8b and 8c so the new
animations land on top of compositor-only primitives.

- [ ] 8a Decoupling: new `macroFilter` slice; right-click = reset;
       tap-Shift toggle, hold-Shift peek with hotkey hints; QueryField
       focus yield.
- [ ] 8b Time.jsx singleton store (useSyncExternalStore); ChevronTop
       layout shell (slot for weather).
- [ ] 7  Compositor-friendly visuals (Chevron + QuickLook path
       cross-fade, transition audit) — see Phase 7 entry.
- [ ] 8c MacrosMenu redesign (stagger entrance built on Phase 7's
       primitives, MiniSearch filter, optional glassmorphism behind a
       settings switch, ≥56px hit targets, MacrosEditor icon picker).
- [ ] 8d Weather widget (lazy chunk, OpenWeatherMap geocoding +
       /weather + /forecast, LocalStorageObject TTL cache, settings tab).
- [ ] 8e Gestures (swipe up/down + trackpad horizontal pagination) +
       minimal touch (no auto-focus on touch, mobile banner becomes
       dismissible toast).

### Phase 15 — Calculator + converters  `[ ]`

Build on Phase 14's engine-typing refactor.

- [ ] **Calculator engine**: parse `2+2*3` style queries; show inline
      result above the suggestions list. Use the existing
      `nerdamer-light` substitute or a 200-line shunting-yard parser
      to keep the bundle small.
- [ ] **Currency converter** is already partially there; formalize as
      an engine type with the same surface as the calculator.
- [ ] **Weight converter**: `100kg in lb`, `5oz in g`. Static unit table.
- [ ] **Time converter**: `9am pst in tokyo`, `2h30m in seconds`. Use
      `Intl.DateTimeFormat` for timezone resolution; no external lib.
- [ ] All four feed into the same "instant answer" UI above suggestions.
```

The existing `Phase 10 — Mobile / touch first-class` entry already
covers the "make mobile work" piece; Phase 8e is the *desktop trackpad
+ optional touch fallback* slice. Make a cross-reference note in
Phase 10 that Phase 8e laid the gesture foundation.

---

## 8. Implementation phasing (commits)

Each commit ships independently; build clean at each step.

### 8.1 Revised sequencing (post-decisions)

Phase 7 (compositor-friendly visuals) and Phase 8 are interleaved
because Phase 8c's stagger animations should be built on top of
Phase 7's compositor-only primitives, not retrofitted later:

```
8a  → Decoupling (logic only, no visuals)
8b  → Time singleton + ChevronTop shell (no visuals beyond layout)
 7  → Compositor-friendly visuals (Chevron path cross-fade, QuickLook audit)
8c  → MacrosMenu redesign (now lands on top of 7's primitives)
8d  → Weather widget
8e  → Gestures + minimal touch
```

8a / 8b are pure logic and can land first regardless. Phase 7 lands
before any new animation work. 8c through 8e follow.

### 8a — Decoupling (no UI redesign yet)

- `src/rules.js`: add `MacroFilter` actor.
- `src/contexts/Store.jsx`: add `macroFilter` to InitialStore +
  reducer rule.
- `src/hooks/useMacroFilter.js`: NEW.
- `src/App.jsx`:
  - Add tap/hold-Shift discrimination.
  - Right-click handler dispatches `resetStore()` when not in default.
  - Mount `useMacroFilter()`.
- `src/components/QueryField/QueryField.jsx`: yield focus when
  `mode === 'opened'`.
- `src/components/MacrosMenu/MacrosMenu.jsx`: read `macroFilter` from
  store; filter the rendered list (simple `.includes()` for now).

**Verification**: open menu via Shift, type "g", only matching cards
show. Right-click anywhere → menu closes. Esc with filter → pop char.
Esc with empty filter → close. No QueryField interference.

### 8b — Time.jsx singleton + ChevronTop shell

- `src/components/Time/timeStore.js`: NEW (one interval, listeners).
- `src/components/Time/Time.jsx`: switch to `useSyncExternalStore`.
- `src/components/ChevronTop/`: NEW shell, hosts `<Time />` only for
  now (slot for `<Weather />` left empty).
- `src/components/Chevron/Chevron.jsx`: replace `<Time />` mount with
  `<ChevronTop />`.

**Verification**: clock ticks regardless of menu open / close /
animations. No regression to format / fontSize settings.

### Phase 7 — Compositor-friendly visuals (interleaved here)

This phase is independent of the macro work but is wedged between 8b
and 8c so 8c can land its new animations on top of compositor-only
primitives.

- `src/components/Chevron/Chevron.jsx`: replace SVG `d` morph with
  pre-computed path snapshots (the existing `stages[]` array becomes
  the snapshot set). Render N stacked `<motion.path>` elements, one
  per stage; cross-fade with `opacity` + `transform` only. Removes
  per-frame paint.
- `src/components/QuickLook/`: same audit; cross-fade snapshots.
- Audit `transition: <length>` usages globally; replace any that can
  be done with `transform` / `opacity`.
- Optional: `content-visibility: auto` on the offscreen Settings /
  Cheatsheet panels (low risk, pure perf).

**Verification**: open Chrome DevTools Performance, record opening +
closing the menu. Paint events on the SVG should drop to zero
(transforms + opacity only). No visual regression to the open / close /
search transitions. Tick the box on the Roadmap's Phase 7 entry.

### 8c — MacrosMenu redesign

- `src/components/MacrosMenu/MacrosMenu.jsx`: lazy `MiniSearch`
  factory, stagger animation via Framer (built on Phase 7's
  compositor-only primitives — `opacity` + `transform` only), larger
  card sizing, `data-match` attribute.
- `src/components/MacrosMenu/MacrosMenu.module.css`: hit-target sizing
  (≥56px), dim/scale unmatched cards, optional glassmorphic shell
  gated by `@supports (backdrop-filter: blur(1px))` AND
  `appearance.macroMenu.glassmorphism === true` (default false; user
  opt-in per decision §10 #3).
- `src/components/MacroFilterPill/`: NEW. Floating "filtering: gi…
  (3 results)" pill above the menu.
- **Hold-Shift hotkey hints**: verify `Card.isHintActive` survives.
  Crucially, the hint should fire **even when the menu is not yet
  open** (per decision §10 #2) — the user wants to see what they'd
  launch *before* committing. Move the `useIsKeyPressed('Shift')`
  subscription out of `MacrosMenu` (which is lazy-loaded and only
  mounts after open) into a higher component so the hints can light
  up during the open transition. Likely lift to `Chevron.jsx` and
  pass down as a prop.
- **MacrosEditor icon picker** (decision §10 #6): replace the text +
  datalist input in `MacrosEditorBody` with a popover icon grid.
  - New `src/components/MacrosEditor/IconPicker/IconPicker.jsx`:
    button shows current icon; opens popover with searchable grid of
    all `Object.keys(window.ICONS)` entries; selection writes the
    icon name back to the parent. Keep the underlying value as a
    string so existing macros and the JSON tab stay compatible.
  - Use the existing `Card`-style icon rendering for the swatches so
    it looks consistent with how the icon will appear in the menu.
  - Search field on top filters the grid client-side
    (`name.toLowerCase().includes(query)`).

**Verification**: visual parity check (existing pinned macros render at
the same grid density), filter feel snappy (<16ms per keypress),
empty-state shows for no matches, **hold-Shift hint visible during
open transition AND while menu is fully open**, glassmorphism switch
toggles correctly, MacrosEditor icon picker opens, searches, and
writes back the same string the text input used to.

### 8d — Weather widget + settings

- `src/functions/webUtils/openWeather.js`: NEW. Three exports:
  `geocode(city, key, signal)`, `getCurrent(lat, lon, units, key, signal)`,
  `getForecast(lat, lon, units, key, signal)`.
- `src/components/Weather/weatherCache.js`: NEW (LocalStorageObject
  with TTL).
- `src/components/Weather/Weather.jsx`: NEW. Reads cache, fires fetches,
  hover/tap to expand forecast.
- `src/components/Weather/Weather.module.css`: NEW.
- `src/components/ChevronTop/ChevronTop.jsx`: mount `<Weather />`
  conditionally on `apiKey && lat`.
- `settings/settings.js`: add `weather` category.
- `src/components/Settings/Settings.jsx`: `TAB_ICONS.weather = FiCloud`.
- Settings city-resolve flow (custom `Input` rendering with adjacent
  Resolve button, or a new `SettingType` subclass `LocationInput` —
  prefer the latter for cleanliness).

**Verification**: with no key, no widget, clock centered. Add key, add
city, click Resolve → coordinates filled, widget appears with current
weather. Disconnect network → cached data persists with stale dot.

### 8e — Gestures + minimal touch

- `src/hooks/useGestures.js`: NEW.
- `src/App.jsx`: wire `useGestures` to mode transitions.
- `src/components/MacrosMenu/MacrosMenu.jsx`: verify Splide's
  `wheel`/`drag` survives.
- Add settings switches under `appearance.gestures`.
- **Touch-aware QueryField focus** (decision §10 #8): in
  `QueryField.jsx`'s focus grabber + `useEffect` initial focus,
  detect touch via `('ontouchstart' in window)` or
  `matchMedia('(pointer: coarse)').matches`. On touch devices, **do
  not** auto-focus the input on mount; only focus when the user
  taps it. This prevents the on-screen keyboard from popping up
  unbidden.
- **Lift mobile banner for macro-only flow**: `App.jsx:235-245`
  currently shows the "mobile not supported" banner when `isMobile
  && !ignoreMobile`. Modify to: **always render Chevron + macros
  menu**; show the banner as a dismissible toast above instead of
  blocking the UI. Touch users who only want the macros menu can
  use it; users who try to type still see the warning. The
  `ignoreMobile` localStorage key keeps working as the
  dismiss-permanently mechanism.
- **Larger touch hit targets in MacrosMenu**: already satisfied by
  8c's ≥56px requirement.

**Verification**:
- Trackpad two-finger swipe up on the page → menu opens. Two-finger
  swipe down → closes. Inside menu, two-finger horizontal swipe
  paginates. Disabling either switch in Settings respects the toggle.
- On a touch device (or DevTools touch emulation), load the page →
  no on-screen keyboard appears. Swipe up → menu opens, no keyboard.
  Tap a card → navigation. Tap the (now-blank) center → QueryField
  focuses and keyboard appears (intentional).
- Mobile banner is a dismissible toast, not a full-page block.

---

## 9. Testing notes (for the implementer)

The repo doesn't have a test harness yet (Phase 13 is queued). For
each commit:

- `npm run build` (defaults to `build:static`). Must succeed and
  produce a sub-1100 KiB bundle.
- `npm run build:hosted`. Verify the new lazy chunk appears
  (`Weather-*.js`, `MiniSearch-*.js`).
- Manual test plan in each commit's verification section above.

When Phase 13 lands later, port the manual checks to Vitest:

```js
test('right-click in opened mode resets store', () => {
  // mount App with opened mode
  // dispatch contextmenu event
  // expect store.mode === 'default' && store.macroFilter === ''
})
```

Add to Phase 13's coverage list:

- Tap-Shift toggle vs hold-Shift peek discrimination.
- macroFilter pop on Backspace, clear on close.
- Weather cache TTL gating (mock Date.now).
- Geocode failure fallback (no widget shown).
- Gesture handler ignores swipes shorter than 60px / longer than 600ms.

---

## 10. Resolved decisions

User-confirmed answers to the original open questions (2026-05-05):

1. **Forecast density**: ✅ 5-day strip on hover. Today-only by default,
   slide-down strip on hover (desktop) / tap (touch).
2. **Hold-Shift typing**: ✅ Tap-Shift only typing. Hold-Shift remains a
   pure peek mode — but **must show visual indication** of what would
   launch on each card. The existing `Card.isHintActive` (driven by
   `useIsKeyPressed('Shift')` in `MacrosMenu.jsx:35,116`) already does
   exactly this — show the hotkey letter overlay on every card while
   Shift is held. **Keep this behavior, verify it works after the
   redesign.** Don't gate it on `mode === 'opened'`; it should also
   work *before* the menu is open (so the user can see what they're
   about to launch as soon as they hold Shift).
3. **Glassmorphic backdrop**: ⚠ Nice-to-have. Prioritize performance and
   stability. Implementation: ship a solid (non-blurred) backdrop in
   8c; gate `backdrop-filter` behind a `@supports` query and an
   `appearance.macroMenu.glassmorphism` settings switch (off by
   default). User can opt in.
4. **Settings tab icon for weather**: ✅ `FiCloud`.
5. **Calculator timeline**: ✅ Deferred. Phase 15 stays where it is.

### 10.1 New decisions (added 2026-05-05)

6. **Icon picker for macros**: ✅ Add to MacrosEditor as part of 8c
   (lifts naturally because we're touching macro UX anyway). Today's
   editor has a datalist autocomplete on a text input (Phase 4.5,
   `MacrosEditorBody`). Replace it with a popover grid of every
   `window.ICONS` entry, searchable by name. Keep the text input as
   the underlying value; the picker just writes to it. ~3 KB of new
   code; no new dep (icons are already in the bundle). See §13.1.
7. **Phase 7 (compositor-friendly visuals) bundled in**: ✅ Land
   **between 8b and 8c**. See §8.1 for revised sequencing.
8. **Touch support in Phase 8**: ✅ Minimal viable touch lands in 8e.
   The macros menu is theoretically touch-ready already; we just need
   gestures + don't-auto-focus-on-touch + lift the mobile banner for
   the macro-only flow. Full mobile (PWA, viewport notch, on-screen
   keyboard polish) stays Phase 10. See §13.2.

---

## 14. Cross-reference: Phase 7 + touch-now scope (added 2026-05-05)

### 14.1 MacrosEditor icon picker (decision §10 #6)

Today's macros editor (Phase 4.5) lets you type an icon name into a
text input that has a `<datalist>` of `window.ICONS` keys. Functional,
but discovery is poor — users have to know the icon name to even
start typing.

The picker:

- Lives in `src/components/MacrosEditor/IconPicker/`.
- Trigger: a small button next to the icon-name field rendering the
  current icon (or a generic placeholder when blank).
- Popover: floating panel with a search input on top, scrollable
  grid of icon swatches below.
- Search: substring match on the icon's lowercase name. Initial
  render shows the full grid.
- Selection: click a swatch → write the name to the parent state,
  close popover.
- Mark popover with `[data-keep-focus]` so the QueryField focus
  grabber leaves it alone (consistent with Phase 4 / Phase 7 modal
  conventions).
- No new dep. Reuses `window.ICONS` already on the page.
- Bundle cost: ~3 KB. Falls under the MacrosEditor lazy chunk; zero
  first-paint cost.

### 14.2 Minimal touch path (decision §10 #8)

Defining what "minimal touch" means so it stays scoped:

**In Phase 8e:**
- Swipe gestures (open/close menu, paginate within).
- Don't auto-focus QueryField on touch devices.
- Mobile banner becomes a dismissible toast, not a full-page block.
- Verified hit targets ≥ 56px (already in 8c).

**Explicitly NOT in Phase 8e** (stays Phase 10):
- PWA / service worker / install prompt.
- Viewport / safe-area handling for notched phones.
- Orientation change handling.
- Polishing the QueryField for touch keyboards (autocomplete,
  spell check, capitalization defaults).
- Pull-to-refresh suppression.
- Haptic feedback.

This keeps Phase 8e a ~100-line addition rather than a parallel mobile
project. The macros menu on touch is fully functional after 8e — user
can swipe up, swipe left/right, tap an icon, never see the keyboard.
Search-on-mobile is the work that's still deferred.

### 14.3 Phase 7 timing rationale

8a / 8b are pure logic (mode decoupling, time fix). They can land
anytime — no animation entanglement.

Phase 7 must precede 8c because:

- 8c adds a stagger entrance to the menu cards.
- If Phase 7 establishes "compositor-only" as the rule (cross-faded
  path snapshots, no per-frame paint), then 8c follows the rule from
  day one.
- If Phase 7 came after, 8c would need to be re-audited and possibly
  reanimated. Easier to do it right the first time.

Phase 7's footprint is small: it's a rewrite of `Chevron.jsx`'s
animation orchestration to render N stacked path snapshots and
cross-fade between them with `opacity` / `transform`. The `stages[]`
array (`Chevron.jsx:59-104`) already enumerates the four shapes —
that's the snapshot set. The rewrite is mechanical: compute each
snapshot once, render all four, animate `opacity` per snapshot
during transitions instead of animating `d`.

QuickLook gets the same treatment.

---

## 11. Glossary (so future-Claude knows the names)

- **Macro mode**: the `mode === 'opened'` state in the store. Old name,
  kept for grep-ability.
- **Macro filter**: the `macroFilter` slice (new). String typed by user
  while macro mode is active.
- **Tap-Shift**: Shift key released within 250ms with no other key
  pressed during the hold.
- **Hold-Shift / peek**: Shift held >250ms or with another key pressed
  during the hold. Releases close the menu.
- **MacrosMenu**: the lazy-loaded grid component in
  `src/components/MacrosMenu/`. Backed by `window.CONFIG.macros` filtered
  to `pinned: true`.
- **ChevronTop**: new component wrapping the clock + weather row; sits
  in the top wrapper of `Chevron.jsx`.
- **Geocode**: OpenWeatherMap's `/geo/1.0/direct` endpoint. Free.
- **OneCall**: OpenWeatherMap's paid-tier combined-data endpoint.
  Avoid; we use legacy `/weather` + `/forecast` instead.

---

## 12. Done criteria for Phase 8

All five sub-commits land. Each independently verifiable:

- [ ] 8a Macro mode is fully decoupled from search; no two UIs visible
       simultaneously; right-click and Shift behave per the table in §4.1.
- [ ] 8b Clock ticks every second, every mode, every visibility state.
- [ ] 8c Macros menu is touch-friendly, type-filterable, has a pleasing
       stagger entrance, respects `prefers-reduced-motion`.
- [ ] 8d Weather appears when configured, hides cleanly when not, caches
       for offline, fits next to the clock without clutter.
- [ ] 8e Trackpad swipes work; touch swipes work (even if mobile is still
       officially blocked at the banner level).

Bundle stays ≤ 1100 KiB (static). Hosted profile gains 2 lazy chunks
(`Weather-*.js`, `MiniSearch-*.js`), neither >15 KB.

---

## 13. Pre-flight checklist for the implementing session

Read these files first, in this order:

1. `src/rules.js` (mode actors)
2. `src/contexts/Store.jsx` (state machine)
3. `src/App.jsx` (current key + context-menu handlers; recently
   refactored, has `modeRef` + `shiftPeekingRef` already)
4. `src/components/Chevron/Chevron.jsx` (transition table; the bottom
   wrapper hosts MacrosMenu, the top wrapper hosts Time)
5. `src/components/MacrosMenu/MacrosMenu.jsx` (current Splide setup)
6. `src/components/Time/Time.jsx` (current timer; analyze the unmount
   path before rewriting)
7. `src/components/QueryField/QueryField.jsx:140-180` (focus grabber +
   keypress handler — the source of dual-handling)
8. `settings/settings.js` + `settings/settingTypes.jsx` (template
   shape; how `Input`, `Switch`, `Range`, `List` work)
9. `src/components/Settings/Settings.jsx` (sidebar tab generation)
10. `src/classes/localStorage/*` (LocalStorageObject base for the
    weather cache)
11. `Roadmap.md` (style for phase entries; commit-message style)
12. Latest commit (`git log -1 --stat`) — confirms current baseline.

Then:

- Confirm pushback decisions with the user (§ 10 questions).
- Open a branch or worktree for Phase 8.
- Land 8a → 8e in order, one commit each, message style:
  `Phase 8a: macro mode decoupling`, etc.
- After 8e: update `Roadmap.md`'s Completed section, paste the SHAs.
- Don't push; the user pushes manually (per repo convention).
