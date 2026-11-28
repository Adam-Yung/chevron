# Sites menu and dock

> Verified: 2026-11-28 00:12 · Sources: `src/features/macros/MacrosMenu.jsx`, `src/features/macros/MacrosLayer.jsx`, `src/features/macros/Card.jsx`, `src/features/macros/Dock.jsx`, `src/features/macros/filterMacros.js`, `src/input/keyRouter.js`, `src/input/usePointerInput.js`, `src/input/useTouchGestures.js`
> Serves: `search-and-go`
> Owns: `src/features/macros/Card.*`, `src/features/macros/Dock.*`, `src/features/macros/MacroIcon.jsx`, `src/features/macros/Macros*`, `src/features/macros/filterMacros.js`, `src/features/macros/useGridShape*`

Pinned macros appear in two places. Each site is a round sewn badge cut from the first colour of its background, with its icon
stitched in the theme's thread colour; the macro's text colour and gradient are not shown.

**The dock** sits along the bottom of the idle screen: one click opens a site (Cmd/Ctrl+click or a middle click opens it in a new tab). It holds the first ten
pinned sites and is hidden while you search or use the menu. Turn it off with Settings, Appearance, `dock`.

**The menu** opens with a quick tap of Shift (not when Shift is used to type a capital), a right-click, scrolling up, the button in
the bottom-right corner, or swiping up on a touch screen. It shows the clock (and weather when configured) above a grid of sites.

In the menu:
- type to filter by name, trigger or category; the match is highlighted;
- arrows or Tab move the highlight, Enter opens it (the first match when nothing is highlighted), Alt/Cmd+Enter in a new tab;
- Shift plus a card's letter opens it directly; the letters are shown when the menu was opened from the keyboard;
- scroll sideways or swipe to change page;
- Escape clears the filter, a second Escape (or Shift, scrolling down, swiping down) closes the menu, as do the corner button and a click on empty space.

Grid size, gap, arrows, dots and drag are under Settings, Menu. Which sites are pinned, their icons, colours and keys are edited in
the macros editor (`docs/features/macros-editor.md`).
