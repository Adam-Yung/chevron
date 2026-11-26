# src/features/macros-editor/Fields.jsx

Small native form fields. Each input has a real `<label for>` (accessible names, and tests find fields by label).

`KeyField` exists because object keys cannot be edited per keystroke: an empty or duplicate key is invalid mid-edit and applying it deleted the row or overwrote a sibling. It edits a local draft, commits on blur or Enter, shows an invalid state meanwhile and reverts if the draft is unusable.
