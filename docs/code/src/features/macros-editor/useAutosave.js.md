# src/features/macros-editor/useAutosave.js

Debounced persistence, with three rules that each came from a lost-edit bug.

- The pending edit is flushed on unmount and on `pagehide`/`beforeunload`. Previously the cleanup only cancelled the timer, so closing Settings within 800 ms of typing silently dropped the edit.
- `baseline` is the last persisted value; nothing is scheduled while `value === baseline`, so mounting and reloading from storage never write.
- A failed save leaves the baseline alone, so the next change retries instead of the editor believing it is saved.
