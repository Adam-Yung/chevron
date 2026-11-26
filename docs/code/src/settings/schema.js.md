# src/settings/schema.js

The single description of every setting: a tree of typed entries (`settingType.jsx`, `controlTypes.jsx`, `themeTypes.jsx`). The panel
renders from `template`; `defaults` seeds the store; `hidden` lists paths shown only under "Show advanced".

- `general.redirectTarget` is a switch over `_self`/`_blank` (on means a new tab) and has a `label` because its key reads badly.
- `hidden` is computed once so its identity is stable for the panel's memoisation. It always includes the derived theme colours;
  only primary, secondary and accent are edited, the rest follow through `dependants`.
- Search engines are read from `window.CONFIG` at import, so `config.js` must load first (it does in both builds).
- Adding a setting: add it here with a description, then read it where used. A persisted store without it falls back to the default.
