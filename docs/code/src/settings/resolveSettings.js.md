# src/settings/resolveSettings.js

Turns whatever is in `localStorage.settings` into a safe settings object. The app reads `settings.appearance.themes[activeTheme][scheme]`
without guards, so a hand-edited or half-written store must never reach it unrepaired.

- Merge is type-checked against the defaults: a stored value of the wrong type is dropped and its path reported, a stored object where
  the default is a primitive is dropped, unknown keys (user themes) pass through. `__proto__`, `constructor` and `prototype` keys are
  skipped.
- `repairAppearance` is the last step: valid `activeTheme` and `colorScheme`, every theme has both schemes (missing colours come from
  the default theme).
- Hot path (stored version equals `SETTINGS_VERSION`) skips migration and full validation; cold path migrates a clone (the raw object
  is what gets backed up, so it must stay untouched). Both back up the raw payload when anything was dropped.
- `pickChanged` is the inverse used when saving. Compares by JSON, so array and object values are by value.
