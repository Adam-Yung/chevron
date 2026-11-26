# src/features/macros-editor/ColorPicker/ColorPicker.jsx

Colour button plus popover (react-colorful). The popover is portaled into `#root` and marked `data-keep-focus`, which the global key handlers honour: without it, Shift typed in the hex box toggled the macros menu. The hex text is a draft and only a complete #rgb/#rrggbb is passed on, so autosave never stores a half-typed colour.
