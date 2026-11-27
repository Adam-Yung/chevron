# src/features/chevron/searchMotion.js

The move into search has two beats: chevron to a straight line on the edge, then that line springs out into the curve. The line has
the curve's heights and no width, so the second beat changes only x. That is why the fill, which is DOM, can follow the canvas with a
horizontal `scale` on the same spring, handed to CSS as `linear()`. One definition of timing and spring keeps the two together.
