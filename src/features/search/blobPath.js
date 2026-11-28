/**
 * The search blob: the region between the left screen edge and a curve bulging out to `reach` at mid-height.
 * `top` and `bottom` (0..1) bend the curve near its ends, as the chevron.quickLook curvature settings always did.
 * @returns {string} SVG path data in px
 */
export function blobPath({ reach, height, top, bottom }) {
  const r = round(reach)
  const h = round(height)
  const mid = round(height / 2)
  const upper = `C0,${round(bottom * height)} ${r},${round(top * height)} ${r},${mid}`
  const lower = `C${r},${round(height - top * height)} 0,${round(height - bottom * height)} 0,${h}`
  return `M0,0 ${upper} ${lower} Z`
}

const round = n => Math.round(n * 10) / 10

/** How far the blob bulges out: the same measure as --chev in global.css. */
export function blobReach(width, height) {
  return width < height ? width * 0.4 : height * 0.5
}

// The chevron canvas is a square this many viewport heights wide. In landscape the tip sits half a height from the canvas centre, so
// a canvas of exactly one height would cut the stripe flat there; the bounce swings further still. Chevron.module.css repeats the number.
export const CANVAS_OVERHANG = 1.4

// A viewport height fraction as a canvas fraction.
const toCanvasY = v => 0.5 + (v - 0.5) / CANVAS_OVERHANG

// The same curve as morph points, so the chevron can become it: tip, then two controls and an end per arm, down then up. Units
// are canvas sides, x from the screen edge (the canvas centre while searching) and y from the canvas top.
export function blobPoints({ reach, height, top, bottom }) {
  const x = reach / (height * CANVAS_OVERHANG)
  return [
    x, 0.5,
    x, toCanvasY(1 - top), 0, toCanvasY(1 - bottom), 0, toCanvasY(1),
    x, toCanvasY(top), 0, toCanvasY(bottom), 0, toCanvasY(0)
  ]
}
