# src/features/settings-panel/SettingsPane.jsx

Chooses what a tab shows: the macros editor (`../macros-editor/MacrosEditorBody`, no props), the weather pane (generic fields plus
`GeocodeRow`, which owns the city field so Resolve sits beside it), or the generic category fields. `hidden` is passed down from the
shell so "Show advanced" applies to every pane.
