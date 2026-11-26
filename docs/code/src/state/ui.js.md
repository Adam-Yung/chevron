# src/state/ui.js

The only UI state and the only way to change it (decision: `docs/decisions/architecture.md`). Invariants, enforced after every action:
- view `search` if and only if the query is non-empty; `idle` otherwise unless the sites menu is open;
- outside `macros` the filter, hints and menu cursor are empty;
- an empty query has no selection and no AI prompt;
- `leaving` never blocks anything, and any user action cancels it;
- Escape always makes progress: overlay, then AI panel, then menu filter, then menu, then query (tested from every state).
`reset` keeps the current notice and bumps `epoch`.
