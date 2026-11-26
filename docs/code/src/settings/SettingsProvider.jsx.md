# src/settings/SettingsProvider.jsx

Owns the settings state and the four contexts the app reads (`SettingsContext`, `SetSettingsContext`, `ThemeContext`,
`ColorSchemeContext`). Their names are a contract: many features import them.

- Settings are resolved once at import (`loadSettings`), before the first render, so no component ever sees an unmigrated or
  malformed object. `resolveSettings` never throws; see `docs/code/src/settings/resolveSettings.js.md`.
- Persistence is debounced (300 ms) so typing or colour edits do not write on every change, and flushed on `pagehide` and on
  unmount so the last edit survives closing the tab. `beforeunload` is not used: `pagehide` also fires on mobile and bfcache.
- Only the difference from the defaults is written (`pickChanged`). A default changed in a later release therefore reaches every
  user who never touched that setting; before this, every install had stored every default.
- The first effect run writes once on mount. That is deliberate: it persists a migration or a repair of a corrupt store.
- The setter is React's own `setState`, so updaters must be pure and return a new object.
- Known cost: the context value changes on every edit, so every consumer re-renders. Edits are rare (panel only) and path copies
  keep untouched branches identical, so consumers that memoise on a sub-object skip work.
