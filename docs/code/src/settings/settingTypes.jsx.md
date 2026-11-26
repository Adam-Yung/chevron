# src/settings/settingTypes.jsx

Barrel only: the schema imports every entry type from here. Implementations live in `settingType.jsx` (base),
`controlTypes.jsx` (List, Switch, Range, Input) and `themeTypes.jsx` (Color, Palette, Theme). Split so each file has one concern and
the colour picker import stays out of the plain controls.
