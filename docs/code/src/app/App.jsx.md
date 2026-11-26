# src/app/App.jsx

The layout and the wiring of input, nothing else. `useInput` installs the one keyboard router, pointer and touch handlers and the
navigation release; `useIntents` carries out what they decide. `data-view` on the root is the single visible signal of the UI view
(CSS and the e2e suite both read it).

- Settings and the cheatsheet mount only while open (lazy chunks). The cheatsheet used to stay mounted, which fetched its chunk on
  every first visit, competing with the app's own files on slow networks; the service worker precaches it after boot anyway.
- Closing any overlay refocuses the search field, so typing works again without a click.
- Decision record: `docs/decisions/architecture.md`.
