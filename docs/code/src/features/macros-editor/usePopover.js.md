# src/features/macros-editor/usePopover.js

Shared open/close/position logic for the colour and icon popovers. Placement is measured in a layout effect so there is no frame at the wrong position; it flips above the trigger when there is no room below and clamps to the viewport (390 px wide phones). Escape closes only the popover: React events bubble through portals, so without `stopPropagation` Escape would also close the Settings modal.
