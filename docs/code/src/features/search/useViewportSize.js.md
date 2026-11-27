# src/features/search/useViewportSize.js

Viewport size updated at most once per animation frame, shared by every subscriber.

The size is read again on subscribe and when the tab becomes visible: a resize from zero can happen before anything listens.
