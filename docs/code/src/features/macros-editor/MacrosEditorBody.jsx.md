# src/features/macros-editor/MacrosEditorBody.jsx

Composition root of the editor, embedded by the Settings modal (`src/features/settings-panel/Settings.jsx` imports its default export; keep the path and the `revision` / `onSaved` props).

- All state lives in `useConfigDraft`; this file only lays out the toolbar, the four tabs, the active form and the status.
- Ctrl/Cmd+S is handled with a React `onKeyDown` on the wrapper, so it also catches keys typed inside the portaled colour and icon popovers.
- Forms are mounted only while their tab is active; every tab edits the same `cfg` object, so nothing is lost by switching.

It has no dialog chrome of its own. Handlers are bound here from `draftActions.js` to the current `draft`.
