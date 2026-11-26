# src/features/settings-panel/ColorPicker/ColorPicker.jsx

Colour field: a swatch button opening a popover with the picker, a hex input, and confirm/cancel.

- Edits stay local until the check is pressed, so dragging does not re-render the app or write settings on every pixel. Cancel,
  or a mousedown outside, restores the stored value.
- An unparsable hex is rejected on confirm and leaves the popover open.
- The contrast line uses APCA (`src/lib/getContrast.js`) against the colour named by the setting's `contrast`.

Layout pitfall (fixed): the popover opens below the swatch, right-aligned, and scrolls itself into view. It used to open upward and was
clipped by the category list's `overflow: hidden`, which made the confirm button unreachable. Do not put `overflow: hidden` on an
ancestor between a swatch and the scrolling pane.
