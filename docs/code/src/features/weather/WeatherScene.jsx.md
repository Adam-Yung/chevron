# src/features/weather/WeatherScene.jsx

Animated CSS backdrop for the modal hero, one entry per scene in `SCENES`.

Rain and snow positions are deterministic functions of the particle index (no `Math.random`), so a re-render never reshuffles them.
The keyframes live in `WeatherModal.module.css`; the reduced-motion block there switches them off.
