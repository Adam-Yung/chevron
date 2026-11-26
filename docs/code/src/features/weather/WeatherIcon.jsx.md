# src/features/weather/WeatherIcon.jsx

Inline Meteocons SVGs for OWM icon codes, plus `iconToScene` which picks the modal's backdrop.

SVG ids are suffixed per instance because the chip, the hero and each forecast card can show the same icon at once and duplicate
`id`s would make gradients and clip paths resolve to the wrong copy. The SVG strings are bundled (`?raw`), so no icon request exists.
