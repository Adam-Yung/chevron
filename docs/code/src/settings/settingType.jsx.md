# src/settings/settingType.jsx

Base class of schema entries. An entry draws itself: `render(current, path, onChange)` computes the raw, scaled and formatted value
and calls the subclass's `display`.

- Edits go through `setAtPath`, which copies only the objects along the path. The previous version deep-cloned the whole settings
  tree per keystroke, which made every sub-object a new identity and defeated memoisation downstream.
- `onChange` is stored on the (shared) template instance on each render, so the entry always writes through the latest setter.
  Hidden fields are still rendered (display none) so dependants receive propagated changes.
- `dependants`: changing a parent colour (primary) calls the dependants' own `onChange` so derived colours follow.
- `_parent_.x` paths resolve relative to the setting being drawn, which lets a theme colour name its sibling for contrast checks.
