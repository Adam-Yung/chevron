# src/features/macros-editor/useConfigDraft.js

All editing state and actions for the editor.

- `cfg` is the only source of truth. `rawText` is derived from it when the Raw JSON tab is entered and written back into `cfg` on every keystroke that parses, so the other tabs never show stale data.
- Raw JSON errors are kept in `rawError` and block saving; `cfg` keeps the last valid parse. Leaving the tab with an error discards the broken text and says so in the status line.
- Replacing actions (reset, load bundled, import) ask for confirmation because they are saved right away by autosave; there is no undo.
- Imports keep any section the file omits (older exports) instead of emptying it; a section of the wrong type is an error.
- A revision bump reloads from storage but is ignored on mount: reloading on mount would look like an edit and trigger a pointless save.
