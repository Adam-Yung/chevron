# src/features/search/useAdaptiveFontSize.js

The size is computed during render from a measured container width, not set in an effect: the old effect painted one frame at the previous size on each keystroke (a visible jump).
