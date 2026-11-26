# Architecture

## 2026-11-25 · One UI state, one input router, navigation that never blocks

**Problem, measured on `master` (b47e58e) with Playwright Chromium:**
- With "open results in a new tab", pressing Enter opened the tab but left Chevron frozen in `redirected`: the full-screen search
  blob and the old text stayed after the search tab was closed, and every key was ignored until a reload. `useUpdate` drops every
  update while `redirected` is true, and only a `visibilitychange` could release it.
- Enter took 818 ms to navigate: the query waited for a 2-stage path animation (`window.mainRedirectAnimationEnd`).
- Mode visuals were driven by awaited animation chains (`useTransitions` + `ActiveElements`). The element shown was switched only when
  the previous animation reported its end, through a closure holding a stale `mode`; a mode change mid-animation could leave the
  wrong element on screen. The canvas renderer started a second rAF loop on every morph without stopping the first.
- Two state machines existed: `src/state/machine.js` (never imported) and the `mode` field in the store, plus four separate global
  `keydown`/`keypress` listeners (App, QueryField, useMacroFilter, useIsKeyPressed) each re-checking the mode.
- The static single-file build threw `Cannot read properties of undefined (reading 'engines')`: the inlined bundle ran in `<head>`
  before `config.js`. The dev server served a page with `type="module"` stripped, so it never booted.

**Approaches weighed:**
1. *Patch in place*: release `redirected` on more events, cap animation times, fix the closure. Low risk per fix, but keeps four
   listeners and two state systems; the next feature reintroduces the same class of bug. Poor fit with priority 1.
2. *Adopt a state library* (XState, Zustand). Solves state, adds a dependency (install rule, bundle weight) and does nothing for the
   animation gating or navigation. Medium fit.
3. *Own small core, rewritten*: one pure reducer for all UI state, one pure key router mapping (state, key) to an action, a
   navigation module that never blocks, and visuals that are a function of state (declarative, interruptible). No new dependency;
   every rule is a unit test. Highest churn, best fit with priorities 1 and 2.

**Chosen: 3.** Rules that follow from it:
- `src/state/ui.js` holds the only UI state. The reducer is pure and enforces invariants (view `search` iff the query is non-empty;
  the macro filter is empty outside `macros`; `navigating` never blocks an action). Components read with selectors and change it only
  by dispatching actions.
- `src/input/keyRouter.js` is the only place that decides what a key does. It is a pure function of (state, key) so every shortcut
  has a unit test. One `keydown` listener installs it.
- `src/navigation/navigate.js` opens URLs synchronously inside the key or click handler (popup blockers allow it), and the state is
  released on every way back: a new tab resets at once; same-tab navigation resets on `pageshow`, on visibility return, and after a
  safety timeout for navigations that never leave (external protocols, downloads, blocked URLs).
- Visuals never gate input. Each visual takes the current view and animates toward it; a new view interrupts the old animation.
  No `onAnimationEnd` decides what state the app is in. Transition budget: 250 ms at the default speed.
- Feature code lives by feature (`src/features/<name>/`), shared pure logic in `src/search/`, `src/answers/`, `src/lib/`. Every
  source file has a mirror in `docs/code/`.

The owner was asleep; this was decided under the overnight brief (`docs/brief.md`, awaiting approval). Reversal is a new entry.
