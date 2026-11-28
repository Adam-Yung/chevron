# Macros editor

> Verified: 2026-11-28 00:02 · Sources: `src/features/macros-editor/MacrosEditorBody.jsx`, `src/features/macros-editor/useConfigDraft.js`, `src/features/macros-editor/draftActions.js`, `src/features/macros-editor/useAutosave.js`, `src/features/macros-editor/validateConfig.js`, `src/features/macros-editor/configDraft.js`, `src/storage/macrosConfig.js`, `public/config.js`, `public/icons.js`

Edit the macros, global commands and search engines without touching files. Open **Settings** (gear, top right, `aria-label` "Open settings"), then **Macros** in the sidebar.

## What is stored

Your edits live in `localStorage["chevron.config"]` as `{ version, macros, commands, engines }` and override the bundled `public/config.js`. Saving also updates `window.CONFIG`, so a new or changed macro works on the very next query: no reload. Nothing makes a network request. A saved override replaces the bundled lists whole, so sites added to a later release appear only after **Load bundled** (which also drops your own edits).

## Saving

There is no Save/Cancel pair. Edits are **saved automatically** about 0.8 s after you stop typing, when you close Settings, and when the page is hidden or closed. **Save now** (or Ctrl/Cmd+S) saves immediately. Nothing invalid is ever saved: while an error is shown, the last good version stays in storage. Reload Settings to see the saved state; there is no undo, so use **Export JSON** before large changes.

## Tabs

- **Macros**: one row per macro; click it to expand. Fields: name, category, URL, normalised URL (host), hotkey (a `KeyboardEvent.code` such as `KeyG`, used with Shift), icon, text colour (kept in the config; badges stitch the icon in the theme's thread colour), pinned (shown in the macros menu), triggers, background (solid or gradient with stops), and per-macro commands (type, template, description). Use the arrows to reorder and the bin to delete.
- **Commands**: the global `type` + `trigger` pairs that macros can implement.
- **Engines**: search engines. The engine id (key) and each query type are edited as text that is applied when you leave the field (Enter or click away); an empty or already used id reverts. Templates use `{@}` (the query as typed) and `{$}` (the parsed query).
- **Raw JSON**: the whole config as text. It must contain `macros` (array), `commands` (array) and `engines` (object). Leaving the tab while the JSON is broken restores the last valid version and says so.

### Triggers

Type a trigger and press Enter, Tab or comma (or click away) to turn it into a chip; Backspace on empty text removes the last chip. Duplicates are ignored. The first macro to list a trigger wins, and the editor warns when two macros share one.

### Icons and colours

The icon picker lists `window.ICONS` from `public/icons.js`; add more with `node scripts/add-icon.mjs <domain> --write`. The colour picker accepts `#rgb` or `#rrggbb`; a half-typed value is not applied. Both open in popovers that close on an outside click or Escape (Escape does not close Settings).

## Import, export, reset

- **Export JSON** downloads `chevron-config.json`.
- **Import JSON...** replaces the editor content with the file. Sections missing from the file keep their current value.
- **Load bundled** puts the bundled config into the editor; **Reset to bundled** also deletes your override. All three ask for confirmation, and, like any edit, are saved straight away.

## Validation and the URL-scheme guard

Errors block saving and name the macro (name and position) and field, for example `Macro "Evil" (#2), URL: URLs starting with javascript:, data:, vbscript: or file: are not allowed.` The same guard (`findForbiddenUrls` in `src/storage/macrosConfig.js`) runs when the config is loaded at start-up, so a hand-edited override cannot inject a script URL. Other errors: empty macro name or URL, empty command type, an engine query type without a template. A trigger used twice is only a warning.

## Limits

- No undo and no Cancel; changes are always persisted.
- Typing inside the editor never reaches the search field and Shift does not open the macros menu there (the dialog and its popovers are marked `data-keep-focus`).
