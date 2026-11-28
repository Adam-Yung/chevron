# Keys, mouse and touch

> Verified: 2026-11-28 00:12 · Sources: `src/features/cheatsheet/Cheatsheet.jsx`, `src/features/cheatsheet/shortcuts.js`, `src/features/cheatsheet/ShortcutTable.jsx`
> Serves: `search-and-go`, `never-stuck`, `runs-anywhere`
> Owns: `src/input/**`, `src/features/cheatsheet/**`, `src/features/onboarding/**`, `src/app/Corners.jsx`, `src/app/LayoutButton*`, `src/app/dialogEvents.js`

The cheatsheet is a dialog listing every shortcut. Its content is data in `src/features/cheatsheet/shortcuts.js`; the key router
(`src/input/keyRouter.js`) decides what the keys do, and the two must be edited together.

## Opening and closing
- `?` with an empty search field or in the sites menu, or the `?` button at the top left.
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
- Typing filters the cards; Shift plus a card's letter opens it.
- Arrows or Tab move the highlight, Enter opens it (Alt or Cmd: new tab).
- Esc clears the filter, then closes the menu; Shift closes it.

**Anywhere**
- `?` on an empty field shows the sheet; Esc closes any panel.

Panels that own the keyboard (this one, Settings, the weather dialog) are marked `data-keep-focus`, and global shortcuts ignore keys
pressed inside them.

## Mouse, trackpad and touch
- A click on empty space puts the caret back in the search field, or closes the open sites menu.
- Right-click toggles the sites menu; on a control, or on the field while it holds text, the browser's own menu opens.
- Scroll up opens the menu and scroll down closes it (setting `appearance.gestures.enableTrackpad`).
- Swipe up on the idle screen opens the menu, swipe left focuses the field; in the menu, down closes and sideways pages; while
  searching, right clears (setting `appearance.gestures.enableSwipe`).
- First-time touch users see two swipe hints once.
- The corner buttons (shortcuts, settings, sites menu) fade after first use where the pointer can hover.

## Limits
- The cheatsheet shows the card shortcut as the letter alone and omits arrows, Tab and Enter in the sites menu. The letter alone
  filters; opening needs Shift.
