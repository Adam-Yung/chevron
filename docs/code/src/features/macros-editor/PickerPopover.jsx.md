# src/features/macros-editor/PickerPopover.jsx

The portal shell shared by the colour and icon pickers: backdrop plus panel, positioned by `usePopover`. It is portaled into `#root` and marked `data-keep-focus`, which the global key handlers honour: without it, Shift typed in the hex box toggled the macros menu.

`Picker.module.css` holds the trigger and popover styles both pickers share; each picker's own module adds the popover size and its contents.
