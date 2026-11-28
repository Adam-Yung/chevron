# src/app/useIntents.js

Executes the intents returned by `src/input/keyRouter.js` (and suggestion clicks). Everything is read through `live`, a ref refreshed
every render, so handlers are never stale and the global listeners are bound once.

- Submit (`submitTarget`): the highlighted suggestion, else an instant answer at the top of the list, else the typed text; instant answers are copied, not opened; only searches and typed URLs
  go into history (macro triggers would only pollute it).
- A launch passes the destination's site name when it has one, so the launch screen can show that site's icon and name.
- Sites menu: the cursor indexes the filtered list; with no cursor, Enter opens the first match.
- Removing history needs a highlighted history entry; anything else is ignored rather than guessed.
