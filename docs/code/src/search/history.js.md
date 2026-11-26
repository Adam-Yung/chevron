# src/search/history.js

Search history with frecency ranking. Entries `{ q, n, t }` (text, uses, last use), newest first, at most `HISTORY_LIMIT`.
- The entries array is replaced on every change and subscribers are notified, so React reads it as an immutable snapshot.
- Re-searching moves an entry to the front instead of duplicating it; matching ignores case.
- The old `[{ id }]` format (MiniSearch era) is migrated on read; the MiniSearch dependency is no longer used here.
- Another tab's write invalidates the cache through the `storage` event.
