# src/features/search/QuickLook.jsx

The blob on the left while searching, showing where Enter will go in that destination's colours. The shape is computed once per
viewport and clipped statically; only a translate animates. The old version animated the clip path itself, repainting the full-screen
marquee every frame. While the query empties the last destination is kept (`useDestination`) so the exit does not flash grey.
