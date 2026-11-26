# src/features/chevron/Chevron.jsx

The central chevron. View maps to a shape stage (idle: chevron, search: vertical edge line, macros: long bar) and to a CSS
translate (centred, or on the left edge while searching). Both retarget when the view changes mid-animation; nothing waits for an end
event. The first render paints the stage directly (no morph from a default shape).

It removes the first-paint shell's static chevron once the canvas has drawn its first frame, or at once when the view leaves idle
(`docs/code/src/app/bootShell.js.md`).
