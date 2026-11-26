# src/storage/macrosConfig.js

Loader and saver for the user's macros, commands and engines (`localStorage["chevron.config"]`, versioned), with the bundled
`window.CONFIG` as the fallback.

- Every read and save rejects `javascript:`, `data:`, `vbscript:` and `file:` URLs anywhere in the tree (a hand-edited or pasted
  config must not inject a script URL). A bad stored config is backed up under `chevron.config.bak.<ms>` and the bundled one is used.
- A successful `saveConfig` and every `resetConfig` set `window.CONFIG` and then dispatch `CONFIG_EVENT` (`chevron:config`) on
  `window`. Modules that copied the config at import subscribe to it. The event is not fired when validation or the storage write
  fails, so listeners never see a config that was not saved.
- `applyPersistedConfigToWindow` runs once before React mounts.
