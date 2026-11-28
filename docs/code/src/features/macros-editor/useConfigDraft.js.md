# src/features/macros-editor/useConfigDraft.js

The editor's state: `cfg`, the raw text and its error, the active tab, the status line, validation and autosave. The actions live in `draftActions.js`.

- `cfg` is the only source of truth.
- A revision bump reloads from storage but is ignored on mount: reloading on mount would look like an edit and trigger a pointless save.
- The autosave effects are registered before the reload effect; keep that order.

Reviewed: df90a3ab
