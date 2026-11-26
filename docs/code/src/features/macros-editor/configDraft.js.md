# src/features/macros-editor/configDraft.js

Pure helpers over the `{ macros, commands, engines }` shape.

- Raw JSON must contain all three sections with the right types. A missing section is an error rather than empty, because normalising it would let a half-typed edit autosave an emptied config.
- `importConfig` is the lenient counterpart for files: omitted sections keep the current value.
