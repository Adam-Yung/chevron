# src/features/macros-editor/recordOps.js

Order-preserving edits for `{ key: body }` maps (engines, engine query types, macro commands). Key order is visible to the user, so renaming or replacing rebuilds the object instead of delete + add, which would move the entry to the end. `renameKey` returns the same object for an empty or taken key so a half-typed name cannot overwrite a sibling.

`patchValue` merges a change into one entry's body (command fields, query-type template).
