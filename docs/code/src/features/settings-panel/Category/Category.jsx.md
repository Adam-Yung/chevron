# src/features/settings-panel/Category/Category.jsx

Renders one schema branch. Nested branches collapse; a theme branch gets a light/dark switch that only chooses which scheme's colours
are edited (it does not change the app's scheme).

- Hidden entries are rendered with `display: none` instead of skipped: colour dependants propagate by calling each dependant's own
  `onChange`, which is bound at render.
- Dividers go between visible items only.
