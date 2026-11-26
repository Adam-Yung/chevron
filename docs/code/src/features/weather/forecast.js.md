# src/features/weather/forecast.js

Pure display helpers for OWM payloads: Celsius colour bands (other units are converted first), 8-point compass, and the per-day
high/low/icon grouping of the 3-hour forecast list. Today is included even if only a few hours remain. The day's icon is the middle
entry of the day, a better "typical weather" than the first (night) or last. Unit-tested.
