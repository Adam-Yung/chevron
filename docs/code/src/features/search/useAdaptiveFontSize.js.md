# src/features/search/useAdaptiveFontSize.js

The size is computed during render from a measured container width, not set in an effect: the old effect painted one frame at the previous size on each keystroke (a visible jump).

It measures in `--font-display` at weight 400, the field's face; the container's own font family is not the field's.

Past the floor size the field wraps.
