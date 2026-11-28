# src/features/macros-editor/IconPicker/IconPicker.jsx

Icon button plus searchable popover over `window.ICONS` (`public/icons.js`). Names are read at render, not module load, so a late icons script cannot leave the list empty. The popover shell is `../PickerPopover.jsx`; the search text stays in `IconPicker` and is cleared each time the trigger is pressed.
