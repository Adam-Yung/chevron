# src/features/search/QuickLook.jsx

The blob on the left while searching, showing where Enter will go in that destination's colours. The shape is computed once per
viewport and clipped statically; only scale and opacity animate, and its scale springs out with the curve around it (`searchMotion.js`). Animating the
clip path itself would repaint the full-screen marquee every frame. While the query empties the last destination is kept (`useDestination`) so the exit does not flash grey.

The fill is felt cut from the destination's first colour (`feltColor`) with the shared weave over it. It draws no outline: the chevron does.

Reviewed: 23bef846
