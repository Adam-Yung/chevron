# Macro Menu Redesign — Phase 8 implementation guide

> **Status legend** (mirrors `Roadmap.md`):
> &nbsp;&nbsp; `[x]` shipped &nbsp;·&nbsp; `[~]` in progress &nbsp;·&nbsp; `[ ]` planned
>
> This document is the **executable spec** for Phase 8. Each section maps
> 1:1 to a sub-commit listed in `Roadmap.md` § "Phase 8 — Macro mode
> reimagined". A fresh-context Claude session should be able to read this
> top-to-bottom and finish Phase 8 without asking the human for any
> design decision that isn't already captured here.
>
> When you ship a sub-commit, **also tick its box in `Roadmap.md`** and
> append the SHA in the commit-message style of the existing entries.

---

## 0. Sequencing snapshot

```
8a              [x]  Decoupling                                 (commit 1ddee78 + earlier)
8b              [x]  Time singleton + ChevronTop shell
8b_continued    [~]  Three regressions from 8a/8b              ← YOU ARE HERE
Phase 7         [ ]  Compositor-friendly visuals
8c              [ ]  MacrosMenu redesign + icon picker
8d              [ ]  Weather widget
8e              [ ]  Gestures + minimal touch
Phase 16        [ ]  README rewrite + project polish            (after Phase 8)
```

Phase 7 is interleaved between `8b_continued` and `8c` so 8c's stagger
animations land on top of compositor-only primitives. See § 8.7.

Phase 8.5 (settings schema + migration) is unrelated to the macro work
and lives alongside, not blocking.

---

## 1. Original problem statement (preserved for context)

The macro menu used to piggyback on the search-mode state machine,
producing two overlapping UIs (menu + suggestions stack). "Shift to
toggle" overlapped ambiguously with "Shift to peek". The clock didn't
tick reliably. Right-click was a toggle (surprising for a destructive
control). There was no type-to-filter, no weather widget, no gestures.

Phase 8 fixes all of the above in five sub-commits, with Phase 7
interleaved so the redesign rests on compositor-only primitives.

### 1.1 Pushback decisions (still in force)

- **Hold-Shift typing is broken at the OS level** (every char arrives
  shifted). Decision: scrap the tap-vs-hold distinction entirely.
  Shift is now a pure toggle. Typing into the open menu uses the new
  `macroFilter` slice. (User-confirmed.)
- **7-day forecast is too dense.** Decision: today-only by default, 5-day
  strip on hover/tap. Configurable.
- **"Touch as a first-class citizen" is Phase 10.** Phase 8e ships
  desktop trackpad gestures + a minimal touch path (no auto-focus,
  bigger hit targets) but does NOT lift the mobile-not-supported
  banner. (User-confirmed.)
- **Skip MiniSearch.** Hand-rolled prefix+substring scorer instead, in
  the spirit of Phase 6's anti-bloat posture. (User-confirmed.)

### 1.2 Resolved decisions (do not relitigate)

1. **Forecast density**: today-only by default, 5-day strip on hover.
2. **Hold-Shift typing**: dropped. Shift = pure toggle.
3. **Glassmorphic backdrop**: ship a solid backdrop in 8c; gate
   `backdrop-filter` behind a `@supports` query AND an
   `appearance.macroMenu.glassmorphism` switch (default off).
4. **Settings tab icon for weather**: `FiCloud`.
5. **Calculator timeline**: deferred to Phase 15.
6. **Icon picker for macros**: lands as part of 8c.
7. **Phase 7 sequencing**: between `8b_continued` and `8c`.
8. **Touch in Phase 8**: minimal viable in 8e; full mobile is Phase 10.
9. **Mobile banner stays as-is** for Phase 8e (per user's most recent
   instruction; the dismissible-toast restructure is Phase 10's job).

---

## 2. State machine reference

`src/rules.js`:

```js
const allowedModes = new Map([
  ['QueryField',  new Set(['default', 'searching'])],
  ['Chevron',     new Set(['default', 'opened'])],
  ['Suggestions', new Set(['searching'])],
  ['Slider',      new Set(['opened'])],
  ['MacroFilter', new Set(['opened'])],   // added in 8a
])
```

`src/contexts/Store.jsx` `InitialStore` shape (post-8a/8b):

```js
{
  mode: 'default',                  // 'default' | 'searching' | 'opened'
  query: '',
  selectedSuggestion: null,
  redirected: false,
  macroFilter: '',                  // 8a: typed-to-filter buffer
  macroHintsKeyboard: false,        // 8b: did Shift open the menu?
  timestamp: Date.now()             // AnimatePresence remount key
}
```

Reducer rules in `useUpdate`:

- Setting `query` recomputes `mode` (`'searching'` if non-empty,
  `'default'` otherwise).
- Leaving `'searching'` clears `selectedSuggestion`.
- Leaving `'opened'` clears `macroFilter` AND `macroHintsKeyboard`.

### 2.1 Current key/event behavior table (post-8a)

```
EVENT                                  STATE TRANSITION                     FILTER ACTION
Shift (default, !repeat)               default → opened                     clear (was already empty)
Shift (opened, !repeat)                opened  → default                    clear
Shift (other modes, !repeat)           resetStore()                         clear
Right-click anywhere                   switchMacrosMenu(false)              clear
Side button (LayoutButton)             switchMacrosMenu(false)              clear
Esc (opened, filter ≠ '')              opened, pop last char                pop char
Esc (opened, filter = '')              opened → default                     clear
Letter / digit / space / -._ in opened append to macroFilter                append
Backspace in opened                    pop from macroFilter (or close)      pop / no-op
'?' (Shift+/, not in editor)           open Cheatsheet                      —
Letter key (default)                   default → searching (QueryField)     —
```

`switchMacrosMenu(viaKeyboard)` propagates the input modality so
MacrosMenu can decide whether to reveal per-card hints (keyboard yes,
mouse/touch no — hints reappear once the user starts typing).

---

## 3. Sub-commit specs

### 3.1 8a — Decoupling — `[x]` SHIPPED

**Done.** Reference for what 8a left in place:

- `src/rules.js`: `'MacroFilter'` actor added.
- `src/contexts/Store.jsx`: `macroFilter` slice + reducer rule.
- `src/hooks/useMacroFilter.js`: NEW. Routes printable keystrokes into
  `macroFilter` while `mode === 'opened'`. Skips when any modifier
  (incl. Shift) is held so hotkeys still reach `MacrosMenu`.
- `src/App.jsx`:
  - Removed `shiftPeekingRef`, `onKeyUpRef`, `window.blur` handler.
  - `switchMacrosMenu(viaKeyboard)`: pure toggle. Uses
    `updateStore({ mode: 'default' })` (NOT `resetStore`) on close so
    `timestamp` is preserved and the Chevron plays its proper close
    animation in reverse.
  - Shift handler passes `viaKeyboard=true`. Right-click and the
    side-button onClick pass `false`.
  - Esc in opened: pop char or close.
  - Mounts `useMacroFilter()` at App level.
- `src/components/QueryField/QueryField.jsx`: focus grabber and
  `keypress` handler short-circuit when `mode === 'opened'`.
- `src/components/MacrosMenu/MacrosMenu.jsx`: reads `macroFilter`,
  filters via hand-rolled `name + category + triggers` substring
  scorer, keys Splide on `macroFilter` to force a clean remount on
  filter change, derives per-card `hotKey` via `nextHintChar`.
- `src/components/Cheatsheet/Cheatsheet.jsx`: documents the new keys.

**Known caveat fixed mid-8a**: original close path used `resetStore()`
which broke the close animation; switched to `updateStore({ mode:
'default' })` which preserves `timestamp` so AnimatePresence does not
unmount/remount the Chevron mid-close.

### 3.2 8b — Time singleton + ChevronTop shell — `[x]` SHIPPED (with regressions)

**Done.** What 8b put in place:

- `src/components/Time/timeStore.js`: NEW. Module-scope ms timestamp,
  `setInterval(tick, 1000)`, listener Set, `subscribeTime` /
  `getTime` exports.
- `src/components/Time/Time.jsx`: switched to
  `useSyncExternalStore(subscribeTime, getTime)`. Constructs `new
  Date(timeMs)` for `formatDate`.
- `src/components/ChevronTop/ChevronTop.jsx`: NEW. Flex row hosting
  `<Time/>`; future slot for `<Weather/>`.
- `src/components/ChevronTop/ChevronTop.module.css`: NEW. Centered
  flex row, `gap: .75em`.
- `src/components/Chevron/Chevron.jsx`: replaced `<Time/>` mount with
  `<ChevronTop/>`.

Phase 8b also added `macroHintsKeyboard` plumbing as a polish item
(keyboard-opened menus reveal hints; mouse/touch-opened ones do not
until typing begins).

**Regressions discovered after merge — see § 3.3 below.**

### 3.3 8b_continued — Three regressions — `[~]` IN PROGRESS

This sub-commit has **no new feature work**. It only resolves three
defects introduced or surfaced by 8a/8b. Each is independently
investigable and verifiable.

#### 3.3.1 Clock pinned at page-load time

**Symptom**: the displayed clock shows the time the page was loaded
(e.g. `8:05`) and never advances. Verified to persist after the
8b rewrite to a `Date.now()` number primitive + plain
`setInterval(tick, 1000)`.

**Hypotheses to investigate, in priority order**:

1. **`useSyncExternalStore` snapshot semantics**: confirm that
   `getTime()` returns a value that React detects as changed each
   tick. Numbers compare by value with Object.is, so a new
   `Date.now()` SHOULD always look fresh — but if the listener is
   never being added (or is being removed by a stray cleanup), no
   re-render is scheduled. Add a temporary `console.log` in `tick()`
   showing `listeners.size` to confirm subscribers exist.
2. **Module identity / HMR**: in dev, Vite HMR may load a fresh copy
   of `timeStore.js` while the original `setInterval` keeps mutating
   the OLD module's `nowMs`. The new `getTime` would always return
   the new module's stale `nowMs`. Test in a production build
   (`npm run build:hosted && npx http-server dist`) — if the bug
   disappears, this is the cause and the fix is to add a HMR-safe
   guard:

   ```js
   if (import.meta.hot) {
     import.meta.hot.dispose(() => clearInterval(intervalHandle))
   }
   ```

3. **Listener never registered**: `useSyncExternalStore`'s `subscribe`
   identity matters — if it changes between renders, React re-subs
   each time and the previous subscription is torn down, which is
   fine, but a bug in the wrapper could leak an unsubscribed
   listener. Make sure `subscribeTime` is exported as a stable
   reference (it is — module-scope function — but verify nothing
   wraps it inside Time.jsx).
4. **`<Time/>` is unmounted before subscribe takes effect**: ChevronTop
   is hosted inside the Chevron's top wrapper which has
   `initial={{ translateY: '100%' }}`. The element IS in the DOM
   (just translated off-screen), so it should subscribe normally.
   Confirm with React DevTools that `<Time/>` is mounted at the
   moment the user reports the stuck reading.
5. **`formatDate` short-circuit**: cross-checked, no caching. Not the
   cause.

**Fix path**:
- Add the diagnostic logs first; reproduce; identify root cause.
- If HMR (most likely), add `import.meta.hot` cleanup.
- If snapshot semantics, switch the snapshot to a stable reference
  pattern: cache the last `nowMs` and only return a new value when
  `tick` actually advanced it (current code already does this — but
  double-check the order of `nowMs = Date.now()` vs notify).
- If subscribe issue, wrap `subscribeTime` / `getTime` in stable
  `useRef`-cached identities at the call site as a defensive measure.

**Files**:
- `src/components/Time/timeStore.js` (likely the fix site)
- `src/components/Time/Time.jsx` (verify only, no expected changes)

**Verification**:
- Open page, leave for 60 s, confirm clock shows current second.
- Open menu (Shift), wait 5 s, confirm clock kept ticking while menu
  was open.
- Close menu, confirm clock continues.
- Search (type into QueryField), submit, hit back button to return
  via bfcache, confirm clock is still live (this exercises the
  `key={timestamp}` remount path that motivated the singleton).
- Repeat in `npm run build:hosted` (production build) to rule out HMR.

#### 3.3.2 Hint slide-in is too short

**Symptom**: the per-card `.hint.active` reveal is "a very short
slide" — visually a quick twitch, not the dramatic diagonal sweep the
original `transition: opacity 2.5s ease, transform 2.5s ease` produced.

**What changed**: 8a polish reduced the duration from `2.5s` to `.2s`
(under the assumption that always-on hints shouldn't replay slowly on
every filter remount). 8b_continued must restore the dramatic feel
while still allowing per-keystroke replay.

**Original CSS** (pre-8a, for reference):

```css
.hint {
  ...
  transform: rotate(35deg) translate(-10%);
  transition: opacity .2s, transform .2s, filter .2s;
}
.hint.active {
  transform: rotate(35deg) translate(20%);
  opacity: 1;
  transition: opacity 2.5s ease, transform 2.5s ease;
}
```

The displacement `translate(-10%) → translate(20%)` is unchanged. The
distinctive feel comes from the **2.5 s ease** running on a rotated
element — slow enough to read as a deliberate reveal.

**Current CSS** (8b_continued first attempt, too short):

```css
.hint.active {
  transform: rotate(35deg) translate(20%);
  opacity: 1;
  animation: hint-slide-in .2s ease both;
}
@keyframes hint-slide-in {
  from { opacity: 0; transform: rotate(35deg) translate(-10%); }
  to   { opacity: 1; transform: rotate(35deg) translate(20%); }
}
```

**Fix**:
- Restore the long duration (≈2.5 s, or experiment with 1.5–2 s).
- Keep it keyframe-based (animations fire on mount; transitions don't)
  so it replays on Splide remount after each keystroke.
- If 2.5 s feels too long for per-keystroke replay, gate the keyframe
  duration via a CSS custom property set on the menu container — long
  on first reveal, shorter on re-reveal. But probably the simpler fix
  is to keep it 2.5 s everywhere; the user's mental model is "I see
  the hints animate in and they're done", not "they re-animate
  constantly".

**Files**:
- `src/components/Card/Card.module.css`

**Verification**:
- Hold Shift / tap Shift / right-click to open menu. Hints slide in
  smoothly across ~2.5 s, diagonally from upper-left to lower-right
  of each card.
- Type a letter. Splide remounts; hints slide in again on the new
  set of cards.
- `prefers-reduced-motion`: animation disabled (already handled).

#### 3.3.3 Hint animation does not fire on initial menu open

**Symptom**: when the menu first opens (whether via Shift, side
button, or right-click), the hint characters are visible at their
final position but never *animated* into it. The animation only
plays after a Splide remount triggered by typing.

**Why**: when MacrosMenu first mounts (lazy-loaded via
`React.lazy`), the Cards mount with `.hint.active` already in their
class list. Theoretically a CSS `animation` declaration runs on
element mount — but `<motion.div>` from framer-motion (used as the
`.hint` wrapper in `Card.jsx`) may set inline `transform` styles or
wrap in a layout effect that overrides the CSS animation's `from`
keyframe.

**Hypotheses to investigate**:

1. **framer-motion stomps on transform**: `<motion.div>` without an
   explicit `initial`/`animate` may still attach a transform style
   that conflicts. **Fix**: change the `.hint` wrapper from
   `<motion.div>` to a plain `<div>`. There's no animation control
   on it from JS — the CSS keyframe is sufficient.
2. **The class is added a frame after mount**: if `isHintActive`
   flips from `false → true` after the first paint, the keyframe
   doesn't fire because CSS animations only fire on a "from no
   `animation` to having an `animation`" transition once per
   mount (browser-specific, but generally yes). **Test**: log
   `isHintActive` in Card render to confirm it's `true` on the
   FIRST render after mount.
3. **MacrosMenu's `Suspense fallback={null}`** (in `Chevron.jsx`)
   may delay the first mount such that the open animation has
   already finished by the time Cards exist — in which case the
   keyframe fires but is masked because the user has already moved
   on visually. **Fix**: pre-warm the lazy chunk (call
   `import('./MacrosMenu/MacrosMenu')` from `App.jsx` once on idle)
   so the first open is instant.

**Fix path**:
- Try (1) first — drop the `motion.div` wrapper. Lowest blast radius.
- If (1) doesn't fix it, instrument with logs to identify whether
  `.hint.active` is present on first paint of the Card.
- (3) is also worth doing for general perceived perf even if it's
  not the root cause here.

**Files**:
- `src/components/Card/Card.jsx` (replace `motion.div` with `div`
  for `.hint`)
- Possibly `src/App.jsx` (pre-warm MacrosMenu chunk)

**Verification**:
- Tap Shift to open: hints slide in across 2.5 s.
- Right-click to open: hints stay hidden (correct: no
  `macroHintsKeyboard`).
- Right-click to open, then type a letter: Splide remounts, hints
  slide in across 2.5 s on the filtered set.
- Tap Shift to open, type a letter: hints replay (or already
  visible — see § 3.3.2 decision on per-keystroke replay duration).

#### 3.3.4 Commit message and roadmap update

When all three regressions are resolved:

- Commit title: `Phase 8b_continued: clock + hint regressions`
- Body should reference each of the three issues by section number
  here.
- Tick the `[~]` boxes in `Roadmap.md` § Phase 8 for `8b_continued`
  to `[x]` and append the SHA. The parent Phase 8 stays `[~]` until
  8e ships.

---

### 3.4 Phase 7 — Compositor-friendly visuals — `[ ]`

**Spec lives in `Roadmap.md` Phase 7.** Land between `8b_continued`
and `8c` so 8c's stagger animations rest on the new primitives.

Outline:

- `src/components/Chevron/Chevron.jsx`: replace SVG `d` morph
  (`stages[]` array currently animated via framer-motion's `d`
  interpolation) with N stacked `<motion.path>` elements, one per
  stage. Cross-fade with `opacity` + `transform` only — zero
  per-frame paint.
- `src/components/QuickLook/`: same audit; cross-fade snapshots.
- Audit any remaining `transition: <length>` usages globally;
  convert to transform/opacity where possible.
- Optional: `content-visibility: auto` on offscreen Settings /
  Cheatsheet panels.

**Verification**: Chrome DevTools Performance recording of menu
open/close shows zero paint events on the Chevron SVG. No visual
regression to open/close/search transitions.

---

### 3.5 8c — MacrosMenu redesign — `[ ]`

#### 3.5.1 Visual targets

- **Grid** of cards (Splide retained for pagination).
- **Card hit target**: min 56×56 CSS px (Apple HIG = 44 pt; Material
  = 48 dp; both fine).
- **Glassmorphic backdrop** (opt-in): `backdrop-filter: blur(16px)
  saturate(1.6)`. Solid fallback when `@supports` fails OR when the
  `appearance.macroMenu.glassmorphism` switch is off (default).
- **Stagger entrance**: `motion.ul` container variants +
  `motion.li` item variants. ~30 ms stagger, total ≤ 200 ms. Built
  on Phase 7's primitives — opacity + transform only.
- **Filter dim** for unmatched cards (only relevant if 8c keeps
  showing all cards instead of the current "remove unmatched"
  approach — see § 3.5.3). `data-match="true|false"` attribute,
  CSS-only animation. No layout shift.
- **Empty state**: filter that matches nothing renders a centered
  "no matches for {filter}" message in place of the grid.

#### 3.5.2 MacroFilterPill

NEW: `src/components/MacroFilterPill/`. Floating pill above the
menu showing the current filter buffer + result count
(e.g. `gi  ·  3 results`). Visible only when `macroFilter !== ''`.
Mounts in the Chevron's top wrapper next to ChevronTop (or directly
above the menu — designer's call, lean toward "above the menu" so
ChevronTop stays a clean clock+weather row).

Marked `[data-keep-focus]` for consistency.

#### 3.5.3 Filter behavior

The current 8a implementation **removes** unmatched cards from the
Splide list (and remounts on filter change). 8c can either:

- **Option A**: keep the remount-on-filter behavior, polish the
  visuals around it. Simpler. No `data-match` machinery.
- **Option B**: render all cards, dim unmatched via `data-match`.
  Animation is smoother (no layout reshuffle) but the Splide grid
  has to handle "fewer matched cards, padded with dimmed ones"
  semantics. More complex.

**Recommended: Option A** for consistency with what shipped in 8a.
Revisit Option B as a Phase 8.x polish if the remount feel is jarring.

#### 3.5.4 Hand-rolled filter scorer

Replace 8a's plain `.includes()` with a slightly smarter scorer:

```js
function score(macro, needle) {
  const name = (macro.name || '').toLowerCase()
  const category = (macro.category || '').toLowerCase()
  const triggers = (macro.triggers || []).map(t => t.toLowerCase())

  // 1. exact name match  → 100
  if (name === needle) return 100
  // 2. name starts with  → 80
  if (name.startsWith(needle)) return 80
  // 3. trigger exact     → 70
  if (triggers.includes(needle)) return 70
  // 4. trigger prefix    → 60
  if (triggers.some(t => t.startsWith(needle))) return 60
  // 5. name substring    → 40
  if (name.includes(needle)) return 40
  // 6. category match    → 20
  if (category.includes(needle)) return 20
  return 0
}
```

Visible set = `pinnedMacros.filter(m => score(m, needle) > 0).sort
((a, b) => score(b, needle) - score(a, needle))`.

Still no MiniSearch dep. Fits in ~30 lines.

#### 3.5.5 Icon picker for MacrosEditor

`src/components/MacrosEditor/IconPicker/IconPicker.jsx` — NEW.
Replaces the text + `<datalist>` field on each macro row.

- **Trigger**: small button next to the icon-name field rendering the
  current icon (or a placeholder when blank).
- **Popover**: floating panel; search input on top; scrollable grid
  of icon swatches below.
- **Search**: substring match on icon name, lowercased. Initial
  render shows the full `Object.keys(window.ICONS)` grid.
- **Selection**: click writes the icon name to the parent state and
  closes the popover.
- **Markup**: marked `[data-keep-focus]`. Reuses `Card`-style icon
  rendering for the swatches so it visually matches the menu.
- **No new dep**. ~3 KB. Falls under the existing MacrosEditor lazy
  chunk.

#### 3.5.6 Settings additions

```js
// settings/settings.js — appearance.macroMenu category
appearance: {
  ...,
  macroMenu: {
    glassmorphism: new Switch({
      default: false,
      description: 'Frost the macros menu backdrop. Disable on slow GPUs.'
    })
  }
}
```

#### 3.5.7 Files touched

```
src/components/MacrosMenu/MacrosMenu.jsx           [MOD]
src/components/MacrosMenu/MacrosMenu.module.css    [MOD]
src/components/MacroFilterPill/                    [NEW]
src/components/MacrosEditor/IconPicker/            [NEW]
src/components/MacrosEditor/MacrosEditorBody.jsx   [MOD]
settings/settings.js                                [MOD]
```

#### 3.5.8 Verification

- Existing pinned macros render at the same grid density as before.
- Filter is snappy (<16 ms per keystroke on a ~30-macro corpus).
- Empty state shows for no-match filter.
- Hold-Shift hint visible during open transition AND once menu is
  open (this is gated on § 3.3.3 being fixed first).
- Glassmorphism toggle works; default off.
- MacrosEditor icon picker opens, searches, writes back the same
  string the text input used to.

---

### 3.6 8d — Weather widget — `[ ]`

#### 3.6.1 Settings additions

```js
// settings/settings.js — new top-level `weather` category
weather: {
  apiKey:       new Input({ default: '', description: 'OpenWeatherMap API key. Free tier at openweathermap.org.' }),
  city:         new Input({ default: '', description: 'City name. Resolved via OpenWeatherMap geocoding once.' }),
  lat:          new Input({ default: '', description: 'Latitude (auto-filled).' }),
  lon:          new Input({ default: '', description: 'Longitude (auto-filled).' }),
  units:        new List({ default: 'metric', options: ['metric', 'imperial', 'standard'], description: 'Temperature units (Celsius / Fahrenheit / Kelvin).' }),
  forecastDays: new Range({ default: 5, min: 0, max: 7, description: 'How many forecast days to show on hover/tap. 0 = today only.' })
}
hidden: ['weather.lat', 'weather.lon']
```

`Settings.jsx` `TAB_ICONS.weather = FiCloud`.

#### 3.6.2 Geocoding flow

Inside the Weather settings tab, add a "Resolve coordinates" button
next to the city input:

```
GET https://api.openweathermap.org/geo/1.0/direct
    ?q={city}&limit=5&appid={key}
```

Show top-5 results in a dropdown; on selection, write
`lat`/`lon`/`city` (canonical name) to settings. Implement as a new
`SettingType` subclass `LocationInput` for cleanliness, OR as
custom rendering within the existing `Input` flow — prefer the
former.

#### 3.6.3 Data fetch

```
GET https://api.openweathermap.org/data/2.5/weather  ?lat={lat}&lon={lon}&units={units}&appid={key}
GET https://api.openweathermap.org/data/2.5/forecast ?lat={lat}&lon={lon}&units={units}&appid={key}
```

Avoid `/onecall` (paid tier). Free tier: 60 calls/min, 1M/month.

#### 3.6.4 Cache

```js
// src/components/Weather/weatherCache.js
class WeatherCache extends LocalStorageObject {
  static key = 'chevron.weather'
  // shape: { current: { ...payload, fetchedAt }, forecast: { ...payload, fetchedAt } }
}
```

TTL: `Date.now() - fetchedAt < 10*60_000` for current,
`< 60*60_000` for forecast. On cache miss, fetch in background and
serve stale data optimistically.

Offline behavior (Phase 4's `useOnlineStatus`): keep showing cached
data with a small "stale" dot until reconnect.

#### 3.6.5 Layout

```
┌─ ChevronTop row ────────────────────────────────────────────────┐
│  ☀ 18°  ⌃ 22°/14°    │    14:32:05    │   tap → forecast strip  │
└─────────────────────────────────────────────────────────────────┘
```

When `weatherEnabled = Boolean(settings.weather.apiKey &&
settings.weather.lat)` is false: weather slot hidden, clock
recenters via `flex-direction: row; justify-content: center`.

ChevronTop becomes:

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

Forecast strip on hover (desktop) / tap (touch): `<motion.div>`
slides down below the ChevronTop row when active. Click-outside or
Esc to close. `prefers-reduced-motion`: skip the slide.

#### 3.6.6 Files

```
src/functions/webUtils/openWeather.js              [NEW]  fetch wrappers w/ AbortController
src/components/Weather/Weather.jsx                 [NEW]
src/components/Weather/Weather.module.css          [NEW]
src/components/Weather/weatherCache.js             [NEW]
src/components/ChevronTop/ChevronTop.jsx           [MOD]  add Suspense<Weather/>
settings/settings.js                                [MOD]
src/components/Settings/Settings.jsx               [MOD]  TAB_ICONS.weather, LocationInput rendering
```

#### 3.6.7 Verification

- No key configured → no widget; clock centered.
- Add key, add city, click Resolve → coordinates fill, widget
  appears with current weather.
- Hover/tap → forecast strip slides in.
- Disconnect network → cached data persists with stale dot.
- Bundle: new `Weather-*.js` chunk in `build:hosted` output, ≤ 8 KB
  gzipped.

---

### 3.7 8e — Gestures + minimal touch — `[ ]`

#### 3.7.1 useGestures hook

`src/hooks/useGestures.js` — NEW:

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
      if (dt > 600) return                     // too slow
      const absX = Math.abs(dx), absY = Math.abs(dy)
      if (Math.max(absX, absY) < 60) return    // too short
      if (absY > absX) (dy < 0 ? onSwipeUp : onSwipeDown)?.()
      else             (dx < 0 ? onSwipeLeft : onSwipeRight)?.()
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
  onSwipeUp:   () => mode === 'default' && updateStore({ mode: 'opened', macroHintsKeyboard: false }),
  onSwipeDown: () => mode !== 'default' && resetStore(),
  // left/right delegated to Splide's own touch handler — don't double-fire
})
```

Splide handles pagination swipes natively; do not intercept those.

#### 3.7.2 Trackpad horizontal scroll for pagination

Splide's `wheel: true` already handles vertical wheel events. For
horizontal: try Splide's `wheelMinThreshold` and `wheelSleep`
options first; if insufficient, add a tiny pass-through that converts
`wheelDeltaX` into `splide.go('+')` / `splide.go('-')`.

#### 3.7.3 Touch-aware QueryField focus

In `QueryField.jsx`'s focus grabber and initial-focus `useEffect`,
detect touch via `('ontouchstart' in window)` or
`matchMedia('(pointer: coarse)').matches`. On touch devices, **do
not** auto-focus the input on mount. User must tap to focus.
Prevents the on-screen keyboard from popping up unbidden.

#### 3.7.4 Mobile banner

**Per user instruction, the mobile banner stays as-is in Phase 8e.**
No dismissible-toast restructure. Touch-banner work moves entirely
to Phase 10.

The banner currently shows when `isMobile && !ignoreMobile`. It
remains a full-screen block with a localStorage escape hatch.

#### 3.7.5 Settings additions

```js
// settings/settings.js — appearance.gestures
appearance: {
  ...,
  gestures: {
    enableSwipe:    new Switch({ default: true,  description: 'Swipe up to open the macros menu, swipe down to close.' }),
    enableTrackpad: new Switch({ default: true,  description: 'Trackpad scroll paginates the macros menu.' })
  }
}
```

#### 3.7.6 Files

```
src/hooks/useGestures.js                           [NEW]
src/App.jsx                                         [MOD]  wire useGestures
src/components/QueryField/QueryField.jsx           [MOD]  touch-aware focus
src/components/MacrosMenu/MacrosMenu.jsx           [MOD]  verify wheel/drag survives
settings/settings.js                                [MOD]  appearance.gestures
```

#### 3.7.7 Verification

- Trackpad two-finger swipe up → menu opens; swipe down → closes.
- Inside menu, two-finger horizontal swipe paginates.
- Toggling either switch in Settings respects the toggle.
- On a touch device (or DevTools touch emulation): page loads → no
  on-screen keyboard appears. Tap center → QueryField focuses,
  keyboard appears (intentional).
- Mobile banner unchanged (full-page block + localStorage escape
  hatch).

---

## 4. Glossary

- **Macro mode**: `mode === 'opened'` in the store. Old name, kept
  for grep-ability.
- **Macro filter**: the `macroFilter` slice (8a). String typed by
  user while macro mode is active.
- **`macroHintsKeyboard`**: store flag (8b) — true iff the menu was
  opened via Shift. Used by MacrosMenu to decide whether to reveal
  per-card hints. Cleared automatically when leaving `'opened'`.
- **MacrosMenu**: the lazy-loaded grid component. Backed by
  `window.CONFIG.macros.filter(m => m.pinned)`.
- **ChevronTop**: 8b's row component hosting the clock; future home
  of the weather widget.
- **MacroFilterPill**: 8c's floating filter buffer indicator.
- **Geocode**: OpenWeatherMap's `/geo/1.0/direct` endpoint. Free.
- **OneCall**: paid-tier OpenWeatherMap endpoint. Avoid.

---

## 5. Bundle budget

Phase 8 targets:

| Item                          | Size  | Lazy? |
|-------------------------------|-------|-------|
| `Weather` chunk + cache + CSS | ~6 KB | Yes — lazy from `ChevronTop` |
| Hand-rolled scorer in MacrosMenu | <1 KB | Already eager via MacrosMenu chunk |
| `useGestures` hook            | ~1 KB | No — App.jsx eager chunk |
| `MacroFilterPill` + CSS       | ~2 KB | No — small enough to stay eager |
| Icon picker                   | ~3 KB | Yes — under MacrosEditor chunk |
| Settings additions            | ~1 KB | Already lazy via Settings chunk |

Net first-paint cost: ~3 KB (gesture hook + filter pill skeleton).

Bundle ceiling: `≤ 1100 KiB` static. Must hold across every commit.

---

## 6. Done criteria for Phase 8

- [x] 8a — Macro mode decoupled from search; no two UIs visible
       simultaneously; right-click + Shift behave per § 2.1.
- [x] 8b — Time singleton + ChevronTop shell.
- [ ] 8b_continued — Clock ticks; hint slide-in is dramatic and fires
       on every open.
- [ ] Phase 7 — Compositor-friendly visuals.
- [ ] 8c — Type-filterable, touch-friendly menu with stagger
       entrance and respects `prefers-reduced-motion`.
- [ ] 8d — Weather widget appears when configured, hides cleanly
       otherwise, caches for offline.
- [ ] 8e — Trackpad swipes work; touch swipes work. Mobile banner
       unchanged.

Bundle stays ≤ 1100 KiB (static). Hosted profile gains the
`Weather-*.js` lazy chunk (~6 KB).

---

## 7. Pre-flight checklist for the implementing session

Read these files first, in order:

1. `Roadmap.md` — current Phase 8 state, surrounding phases.
2. `src/rules.js` — mode actors.
3. `src/contexts/Store.jsx` — state machine + reducer.
4. `src/App.jsx` — Shift handler, right-click handler, focus grabber
   integration, `switchMacrosMenu`, `useMacroFilter` mount point.
5. `src/components/Chevron/Chevron.jsx` — transition table; the
   bottom wrapper hosts MacrosMenu, the top wrapper hosts ChevronTop.
6. `src/components/ChevronTop/ChevronTop.jsx` + `.module.css`.
7. `src/components/Time/timeStore.js` + `Time.jsx` — required reading
   for § 3.3.1.
8. `src/components/MacrosMenu/MacrosMenu.jsx` — current Splide setup,
   filter scorer, hint derivation.
9. `src/components/Card/Card.jsx` + `Card.module.css` — required
   reading for § 3.3.2 / § 3.3.3.
10. `src/components/QueryField/QueryField.jsx:140-180` — focus
    grabber + keypress yield.
11. `settings/settings.js` + `settings/settingTypes.jsx` — template
    shape; `Input` / `Switch` / `Range` / `List` semantics.
12. `src/components/Settings/Settings.jsx` — sidebar tab generation
    + `TAB_ICONS`.
13. `src/classes/localStorage/*` — `LocalStorageObject` base for the
    weather cache.
14. Latest commit (`git log -1 --stat`) — current baseline.

Then:

- Pick the next sub-commit per § 0.
- Implement, build (`npm run build` AND `npm run build:hosted`),
  manually verify against the section's Verification checklist.
- One commit per sub-section. Title style:
  `Phase 8c: MacrosMenu redesign + icon picker`.
- Tick the box in `Roadmap.md`, paste the SHA in the entry.
- Don't push; the user pushes manually (per repo convention).
