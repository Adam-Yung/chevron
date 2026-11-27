# src/features/chevron/Chevron.jsx

The central chevron. View maps to a shape stage (idle: chevron, search: the blob's curve, macros: long bar) and to a CSS translate
(centred, or on the left edge while searching). Both retarget when the view changes mid-animation; nothing waits for an end event.
The first render paints the stage directly (no morph from a default shape).

While searching, the chevron is the blob's piping: there is no second outline. The old version morphed into a vertical line and slid
a separately outlined blob in after it, which could not be made to look like one motion. The search stage therefore depends on the
viewport and curvature settings, and is rebuilt on resize. The canvas is sized off the viewport height (`CANVAS_OVERHANG`), so the
chevron's size is rescaled to keep its pixel size.

It removes the first-paint shell's static chevron once the canvas has drawn its first frame, or at once when the view leaves idle
(`docs/code/src/app/bootShell.js.md`).

Into search it takes two beats, line then bounce (`searchMotion.js`); leaving is one direct morph.
