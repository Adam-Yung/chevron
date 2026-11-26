# src/lib/getCssGradient.js

Settings value (`solid` or `gradient` with angle and stops) to a CSS background string. Anything malformed paints transparent,
because it comes from user-editable config. It copies the colour list before adding stops.

`feltColor` reduces the same value to the one flat colour badges and the blob are cut from; `undefined` lets CSS choose a fallback.
