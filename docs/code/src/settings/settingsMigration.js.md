# src/settings/settingsMigration.js

The stamp (`chevron.settings.version`) exists so the cheap path can skip migrations on every normal load. Bump `SETTINGS_VERSION`
only when a plain merge over defaults cannot absorb the change (a rename, an inversion, a changed default that must override stored
values).

- v3: `performanceMode` (opt-out blur) became `glassmorphism` (opt-in blur); `macroMenu.glassmorphism` merged into it.
- v4: `general.animationSpeed` default fell from 400 to 250 ms. Because every install had persisted the full settings, a stored 400
  is indistinguishable from a choice; it is dropped so the new default applies, and any other value is kept.
- Steps must be idempotent: a crash between migrating and persisting means they run again.
- Backups (`chevron.settings.bak.<ms>`) are never pruned automatically; they are small and only written on a problem.
