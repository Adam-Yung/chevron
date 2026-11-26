# src/features/settings-panel/Settings.jsx

The dialog shell: backdrop, header, sidebar, pane. Contract with `src/app/App.jsx`: default export, prop `{ onClose }`, lazy-loaded so the
colour picker and every control stay out of the boot bundle.

- `data-keep-focus` on the backdrop is how the input router and the search field know to leave the keyboard alone while the panel is
  open. The panel adds no global key listener: Esc is an `onKeyDown` on the dialog, and the dialog takes focus on open (unless a field inside already has it), so Esc works
  even after clicking plain panel text.
- On unmount focus returns to whatever had it before (the gear button). The router and `QueryField` then hand typing back to the
  search field; the e2e spec `scripts/e2e/specs/settings.mjs` guards that.
- Tabs come from the schema's top-level categories plus a synthetic `macros` tab. The active tab is derived (falls back to the
  first) instead of synced by an effect, so toggling "Show advanced" cannot leave a stale tab for a frame.
- Edits are live and persisted by the provider; there is no apply/cancel, so the X and Esc are pure closes.
