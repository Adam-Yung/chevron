# src/features/chevron/useChevronPainter.js

Creates the canvas itself instead of rendering it with React. A canvas transferred to a worker can never be transferred again, and
StrictMode mounts effects twice on the same element, which crashed the dev server. From `file://` the page paints the chevron itself. Chromium throws when asked for a worker there, but Safari and Firefox construct
one that never draws and reports no error, which left the static build with no chevron in both. Where a worker is used it is created
before the transfer, since a transferred canvas cannot be drawn on from the main thread. Resolution follows the
element size times devicePixelRatio (capped), not a fixed 1920 square.

`onFirstFrame` fires when the first drawing is on screen: the worker reports after its own next frame, and the page waits one more
frame of its own, because a message can arrive before the worker's canvas has been composited.

Resizes come from the same `useViewportSize` value the stages are built from, so shape and canvas pixels cannot disagree.

Reviewed: 2391d3dc
