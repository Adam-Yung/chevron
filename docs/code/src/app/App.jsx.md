# src/app/App.jsx

The layout and the wiring of input, nothing else. `useInput` installs the one keyboard router, pointer and touch handlers and the
navigation release; `useIntents` carries out what they decide. `data-view` on the root is the single visible signal of the UI view
(CSS and the e2e suite both read it).

- Settings mounts only while open (lazy chunk); the cheatsheet stays mounted and takes `open`, because it animates its own exit.
- Closing any overlay refocuses the search field, so typing works again without a click.
- Decision record: `docs/decisions/architecture.md`.
