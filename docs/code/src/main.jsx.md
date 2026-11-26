# src/main.jsx

Boot order is the point of this file: `./storage/applyConfig` is imported first so the saved config is in place before any module reads `window.CONFIG`, then the
providers nest from the outside in: error boundary, settings (theme, persistence), UI store, search (suggestions computed once), App.
StrictMode stays on: it double-mounts effects in dev, which is how the canvas transfer bug was found (`docs/code/src/features/chevron/useChevronPainter.js.md`).
