# src/features/cheatsheet/Cheatsheet.jsx

Keyboard-shortcut dialog, `<Cheatsheet open onClose />`. Rendered by App at all times; returns null when closed.

- `data-keep-focus` on the backdrop: global shortcuts ignore keys inside it; Escape and Tab are handled here.
- No exit animation, so rapid open/close toggling cannot leave a half-faded overlay.
- Focus returns to the search field (or the previously focused text field) on close, including when opened from the corner button,
  so typing continues immediately.
- Backdrop closes on `pointerdown` (a click ending there after a text-selection drag would otherwise close it).
