# src/features/chevron/drawChevron.js

Strokes the two bezier arms. Points are normalised with x measured from the canvas centre, which is how `parseStages.js` defines every stage.

The stripe is four strokes of one path: shadow, cloth, a dashed thread band, then cloth again over the band's middle, which leaves
a stitch line inside each edge without offset curves or compositing layers. Both arms start at the tip: a
morph that folds one arm onto the other (the menu's bar) would otherwise put their dashes out of step and fill in the gaps.
The thin-stripe cut-off is judged in CSS pixels (`scale`), or a dense screen would disagree with the shell.
`STITCH` holds the proportions; `index.html` repeats them for the first-paint shell.

Each arm is stroked as its own path, never as two subpaths of one: Firefox with GPU rendering drops the round cap at the end of a
subpath that another follows, which left one arm cut square. Headless browsers render in software and do not show it.

`thickness` is already in canvas pixels; `scale` is canvas pixels per CSS pixel. `ARMS` lists, per arm, the point indices of its
two controls and its end.
