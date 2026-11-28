# Chevron look

> Verified: 2026-11-28 00:12 · Sources: `src/features/stage/Stage.jsx`, `src/features/chevron/Chevron.jsx`, `src/features/chevron/useChevronPainter.js`, `src/features/chevron/morph.js`, `src/features/chevron/parseStages.js`, `src/features/chevron/drawChevron.js`, `src/app/global.css`
> Serves: `look`, `never-stuck`
> Owns: `src/features/chevron/**`, `src/features/stage/**`, `src/app/App.module.css`, `src/app/global.css`, `src/lib/getCssGradient.js`

The Sleeve Patch look: a canvas-textured page with a stitched hem, and one sewn chevron stripe that changes shape with what you
are doing. The decision is in `docs/decisions/visual-style.md`.

## What it does
- Idle: the chevron in the middle. Sites menu: it stretches into a bar. Searching: it becomes a line on the left edge and springs
  into the curve around the destination blob (on narrow portrait screens the stripe is hidden while searching).
- Size and thickness are settings; colours come from the theme (`chevron`, `seam`).

## How it works
`Stage` stacks the blob, the chevron and the sites layer; each follows the current view. The chevron is a canvas morph, drawn in a
worker where possible and on the main thread from `file://`.

## Rules that must hold
- Visuals follow state; no animation end changes state, and a new view interrupts the running morph.
- Reduced motion, or an animation speed of 0, runs at speed zero.
- The first-paint shell in `index.html` repeats the stripe's proportions, so the two must change together.

## How to check it
`src/features/chevron/morph.test.js`, `src/features/chevron/drawChevron.test.js`, `scripts/e2e/specs/boot.mjs`.
