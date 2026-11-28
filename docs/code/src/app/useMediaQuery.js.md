# src/app/useMediaQuery.js

A media query as an external store, used for portrait grids (`useGridShape`) and reduced motion (`useReducedMotion`). The
subscription is stable per query string. Where `matchMedia` is missing it reports false and listens to nothing.
