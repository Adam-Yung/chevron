# src/input/keyRouter.js

What every key does, as a pure function of (UI state, key, focus context). Its tests are the keyboard specification.

Precedence: Shift taps first; then a focused panel (`[data-keep-focus]` or any other editor) owns every key; an open overlay only
takes Escape; the sites menu has its own map (filter letters, Shift+letter hotkeys, arrows, Enter); otherwise the search map (Enter,
Alt/Cmd+Enter, arrows and Shift+Tab through suggestions, Tab to take the highlighted one into the field (or to walk the list when
there is nothing new to take), Shift+Delete, Space Space for AI, `?` on an empty field). A printable key with focus
elsewhere pulls focus to the field and lets the character through. Held Enter and Escape never repeat. A focused button or link
keeps Enter and Space, so keyboard users can press it.

Shapes (the router is pure, so these are the whole contract):

- `state`: the UI state of `src/state/ui.js`.
- `k`, the key input: `type` (`keydown` or `shiftTap`) and, for a keydown, `key`, `code`, `shift`, `ctrl`, `meta`, `alt`,
  `repeat`.
- `ctx`: `inPanel` (focus is inside a `[data-keep-focus]` panel or another editor that owns its keys), `inQuery` (focus is in
  the search field), `onControl` (focus is on a button or link, which activates itself with Enter and Space), `hasSuggestions`,
  `sinceSpace` (ms since the previous Space press in the search field), `hotkeys` (set of `KeyboardEvent.code` values bound to a
  site card).
- Result: `null`, or `{ intent, prevent, ...arguments }`.
