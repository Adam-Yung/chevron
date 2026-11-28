# Search

> Verified: 2026-11-27 23:40 · Sources: `src/features/search/QueryField.jsx`, `src/features/search/Suggestions.jsx`, `src/features/search/QuickLook.jsx`, `src/search/resolve.js`, `src/search/suggestions.js`, `src/search/useSuggestions.js`, `src/search/history.js`, `src/search/autocomplete.js`, `src/app/useIntents.js`, `src/app/useLaunch.js`, `src/navigation/navigate.js`, `src/navigation/useNavigationRelease.js`

## What you can type
Start typing anywhere: the search field always has the keyboard, even while a first visit is still loading; what you type
before the page is ready is kept (Enter only counts once it is). What Enter does depends on the text:

| You type | Enter does |
|---|---|
| A macro trigger (`gh`, `yt`) | Opens that site |
| Trigger + command (`yt?lofi`, `y/dQw4w9WgXcQ`) | Runs the macro's command (search the site, open an id) |
| A web address (`github.com/foo`, `localhost:3000`) | Opens it directly (local addresses over http) |
| Math, units, currency, time zones | Copies the answer (see `docs/features/instant-answers.md`) |
| Anything else | Searches with the engine chosen in Settings |

Hold Ctrl while pressing Enter to search even a trigger or an address. Alt+Enter or Cmd+Enter (or a middle click) opens the result
in a new tab; the start page clears itself at once, so it is blank when you come back. The setting "Open results in a new tab" makes
that the default.

## Suggestions
Shown in this order: instant answers, the macro whose trigger you typed exactly, your history, other matching macros, then Google's
suggestions. Up / Down (or Shift+Tab) move through them; moving past either end returns to what you typed. Tab highlights the first
one, and with a suggestion highlighted Tab puts its text in the field, ready to edit or send. Shift+Delete removes the highlighted
history entry. History is ranked by how often and how recently you searched; it stays in this browser and can be
turned off in Settings.

Local suggestions appear on the same keystroke. Google's arrive after a short pause and are cached, so retyping or backspacing never
waits. Offline, everything except Google's suggestions and currency still works.

## The blob
While you type, the chevron becomes a line on the left that springs out into a curve, and the shape inside it shows where Enter will go, in that site's or engine's first colour, dyed to sit on the canvas.

When Enter opens a result in the same tab, a disc grows from the blob over the screen and keeps the blob's scrolling banner; for a
site it also shows the site's icon and name.

## Never stuck
Leaving the page in the same tab starts the navigation on the keypress; the colour animation only covers loading time. If the page
does not actually leave (an app link, a download, a blocked address), the start page returns to normal within four seconds; coming
back with the Back button always shows a blank page. Every state is left with Escape: it closes a panel, then the AI answer, then
clears the menu filter, closes the menu, and clears the query.
