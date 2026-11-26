# src/features/macros/Dock.jsx

Pinned sites on the idle screen (setting `appearance.dock`). It exists because the most common action on a new tab is opening a
regular site, and before it that needed knowing about Shift. It is `inert` and transparent in every other view so it cannot be clicked
by accident, and low-contrast until hovered so the idle screen stays calm.
