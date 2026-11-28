# Keyboard shortcuts

> Verified: 2026-11-28 00:04 · Sources: `src/features/cheatsheet/Cheatsheet.jsx`, `src/features/cheatsheet/shortcuts.js`, `src/features/cheatsheet/ShortcutTable.jsx`

The cheatsheet is a dialog listing every shortcut. Its content is data in `src/features/cheatsheet/shortcuts.js`; the key router
(`src/input/keyRouter.js`) decides what the keys do, and the two must be edited together.

## Opening and closing
- `?` with an empty search field, or the `?` button at the top left.
- Closes with Esc, the X, or a click on the backdrop. Focus returns to the search field, so typing continues at once.
- With text in the field `?` is just a character.

## The keymap
**Search**
- Type anywhere to search.
- Enter opens the highlighted result, or copies an instant answer.
- Alt+Enter or Cmd+Enter opens it in a new tab.
- Ctrl+Enter forces the search engine, skipping macros.
- Up, Down and Shift+Tab move through suggestions.
- Tab highlights the first suggestion; on a highlighted one it puts that text in the field.
- Shift+Delete removes the highlighted history entry.
- Esc clears the query.
- Space Space asks the AI (`docs/features/ai.md`).

**Sites menu**
- Shift, right-click or scrolling up opens it.
- Typing filters the cards; a card's letter key opens it.
- Esc or Shift closes it.

**Anywhere**
- `?` on an empty field shows the sheet; Esc closes any panel.

Panels that own the keyboard (this one, Settings, the weather dialog) are marked `data-keep-focus`, and global shortcuts ignore keys
pressed inside them.
