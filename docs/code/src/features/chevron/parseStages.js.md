# src/features/chevron/parseStages.js

The six chevron shapes as normalised bezier points, scaled by the `chevron.size` setting. Every stage has the same point count, which is what makes them interpolable.

The value after the points is a stroke-width factor, interpolated by the same morph: the search stage is half width, because a
full-width stripe around the blob swamps the screen. The search stage's points come from `blobPoints`.

`Chevron.jsx` uses stages 0 (idle), 2 (search), 4 (menu bar) and 5 (the line on the way into search). Nothing selects 1 or 3.

`stagesFor` must never return NaN: the chevron now depends on the viewport, a tab can load with none, and NaN points draw nothing.

`size` is the chevron's size as a fraction of the canvas side. A page with no size yet (a tab loading in the background) gets the
default shapes.
