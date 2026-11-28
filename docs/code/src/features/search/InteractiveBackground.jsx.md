# src/features/search/InteractiveBackground.jsx

The engine- or site-coloured fill with the slow diagonal marquee inside the search blob and the launch disc (`src/app/LaunchOverlay.jsx`). The marquee is pure CSS transform animation and pauses when the blob is hidden.

Callers choose only size, colour (a string or a gradient description for `getCssGradient`), banner text, text colour and
`paused`; angle, density, speed and text styling are fixed. The marquee is two identical halves so the animation loops without a
seam, with twice the rows for words under five characters. The rotated square is sized to the diagonal so it covers the viewport
at any angle.
