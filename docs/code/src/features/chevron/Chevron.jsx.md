# src/features/chevron/Chevron.jsx

The central chevron. View maps to a shape stage (idle: chevron, search: vertical edge line, macros: long bar) and to a CSS
translate (centred, or on the left edge while searching). Both retarget when the view changes mid-animation; nothing waits for an end
event. The first render paints the stage directly (no morph from a default shape).
