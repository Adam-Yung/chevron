# src/lib/color.js

Small replacement for colorjs.io (about 25 KB saved). It supports exactly what Chevron uses: hex and rgb parsing, APCA contrast, and OKLCH lightness adjustment for hover and active shades.

- Lightness is OKLCH L scaled to 0..100 so old `l => l + 10` call sites keep working. Out-of-gamut results are clamped per channel, so a saturated colour at L=100 is a very light tint, not pure white.
- Named colours are resolved by the browser via a throwaway element; in non-DOM environments they return null.
- `contrast(other)` is APCA only; the algorithm argument is accepted and ignored for call-site compatibility.
- `new Color` and `Color.parse` throw on bad input, which the ColorPicker relies on for validation.
