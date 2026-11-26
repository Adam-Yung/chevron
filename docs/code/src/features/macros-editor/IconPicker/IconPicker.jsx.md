# src/features/macros-editor/IconPicker/IconPicker.jsx

Icon button plus searchable popover over `window.ICONS` (`public/icons.js`). Names are read at render, not module load, so a late icons script cannot leave the list empty. Portaled and `data-keep-focus` for the same reason as the colour picker.
