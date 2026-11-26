# src/features/chevron/chevron.worker.js

Runs the painter off the main thread with an OffscreenCanvas, so the morph keeps its frame rate while React renders suggestions. Same protocol as the main-thread fallback (`chevronPainter.js`). Its one message back, `painted`, tells the page the first frame is
up.
