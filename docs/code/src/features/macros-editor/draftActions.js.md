# src/features/macros-editor/draftActions.js

Everything the editor can do to a draft: save, autosave, tab switch, slice and raw edits, reset, load bundled, export, import. Each is a plain function of the `draft` from `useConfigDraft`, so it sees the values of the render that called it (an import keeps merging onto the config that was on screen when the file was picked).

- `rawText` is derived from `cfg` when the Raw JSON tab is entered and written back into `cfg` on every keystroke that parses, so the other tabs never show stale data.
- Raw JSON errors are kept in `rawError` and block saving; `cfg` keeps the last valid parse. Leaving the tab with an error discards the broken text and says so in the status line.
- Replacing actions (reset, load bundled, import) ask for confirmation because autosave saves them right away; there is no undo.
- Imports keep any section the file omits (older exports) instead of emptying it; a section of the wrong type is an error.
