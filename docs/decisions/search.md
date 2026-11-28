# Search

## 2026-11-27 · Tab fills the field with the highlighted suggestion

**Asked by the owner:** Tab on a focused suggestion should fill the query with it.

**Weighed:** a new key for filling, keeping Tab as "next" (no change to habits, but not what was asked); Tab always fills the first
suggestion (one keystroke less, but takes a suggestion nobody looked at); **Tab highlights, then fills (chosen):** the first Tab still
highlights, a second takes the text, arrows and Shift+Tab do the moving. When the highlighted text equals what is typed there is
nothing to fill, so Tab moves on instead of appearing dead.

## 2026-11-27 · The launch screen keeps the blob's banner

**Asked by the owner:** the site's banner vanished as the launch disc expanded; add it back.

**Weighed:** growing the blob itself to full screen (closest to the old look, but couples the stage to navigation and risks a stuck
blob); a banner faded in over the disc (flickers over the page); **the disc as a `clip-path` circle holding the same banner
(chosen):** one self-contained overlay, nothing stretched. `clip-path` is not the usual transform-only animation; it runs after
navigation has started, so it cannot delay it.
