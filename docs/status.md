# Status

Present reality only, short: what works, what is in progress, open blockers. History is git and `docs/decisions/`; next work is
`docs/todo.md`. Replace a paragraph when it stops being true; do not append.

**Works:** both build profiles boot (static over http and `file://`, hosted); the dev server boots.

**In progress (branch `overnight/rearchitecture`):** re-architecture per `docs/decisions/architecture.md`.

**Blockers waiting on the owner:** approve `docs/brief.md`; run `scripts/owner/install-deps.sh --run` to add `playwright-core` so the
end-to-end suite runs without a local path override.
