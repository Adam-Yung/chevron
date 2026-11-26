# src/settings/controlTypes.jsx

The plain controls. Behaviour that fixed real problems:

- `Switch` is a `button role="switch"` with `aria-checked` (it was a clickable span: no keyboard, no accessible state) and no longer
  prints the raw value beside it, which showed `_self` for the redirect setting.
- `Range` uses `NumberField` so emptying the box does not write 0 and lock the user out of typing.
- `List` with a string `list` reads the options from another setting (theme names).
