# src/features/chevron/useChevronPainter.js

Creates the canvas itself instead of rendering it with React. A canvas transferred to a worker can never be transferred again, and
StrictMode mounts effects twice on the same element, which crashed the dev server. The worker is created before the transfer because
on `file://` creating it throws, and a transferred canvas cannot be drawn on from the main thread either. Resolution follows the
element size times devicePixelRatio (capped), not a fixed 1920 square.
