// Fractions of the thickness; index.html repeats them for the first-paint shell, which must look the same.
export const STITCH = { shadow: 1.2, outer: 0.7, inner: 0.56, dash: 0.3, gap: 0.2, minThickness: 12 }

// Indices into the points: two controls and an end per arm. Both arms start at the tip (0, 1), so their dashes stay in step
// when a morph lays one arm over the other (the menu's bar).
const ARMS = [[2, 3, 4, 5, 6, 7], [8, 9, 10, 11, 12, 13]]

const fromCentre = (v, width) => v * width + width / 2

function traceArm(ctx, p, [ax, ay, bx, by, cx, cy], { width, height }) {
  ctx.beginPath()
  ctx.moveTo(fromCentre(p[0], width), p[1] * height)
  ctx.bezierCurveTo(
    fromCentre(p[ax], width), p[ay] * height, fromCentre(p[bx], width), p[by] * height, fromCentre(p[cx], width), p[cy] * height)
}

// One pass of the stripe. One path per arm: GPU-rendered Firefox drops the end cap of a subpath that another one follows.
function sew(ctx, p, size, { lineWidth, strokeStyle, dash = [], lineCap = 'round' }) {
  ctx.setLineDash(dash)
  ctx.lineCap = lineCap
  ctx.lineWidth = lineWidth
  ctx.strokeStyle = strokeStyle
  for (const arm of ARMS) {
    traceArm(ctx, p, arm, size)
    ctx.stroke()
  }
}

// Strokes the two arms of `p` (0..1 of the canvas, x 0 at its centre) as a sewn stripe. `thickness` is in canvas pixels and
// `scale` is canvas pixels per CSS pixel.
export function drawChevron(ctx, p, { width, height, color, thread, thickness, scale = 1 }) {
  const size = { width, height }
  ctx.clearRect(0, 0, width, height)
  ctx.lineJoin = 'round'
  // The stage's width factor. The dash comes from the full thickness, so the stitches keep their length while the stripe narrows.
  const band = thickness * (p[14] ?? 1)
  sew(ctx, p, size, { lineWidth: band * STITCH.shadow, strokeStyle: 'rgba(0, 0, 0, 0.3)' })
  sew(ctx, p, size, { lineWidth: band, strokeStyle: color })
  // Below this the two stitch lines merge into noise.
  if (thickness < STITCH.minThickness * scale) return
  // A dashed band with its middle painted back over leaves one dashed line inside each edge, without compositing layers.
  const dash = [thickness * STITCH.dash, thickness * STITCH.gap]
  sew(ctx, p, size, { lineWidth: band * STITCH.outer, strokeStyle: thread, dash, lineCap: 'butt' })
  sew(ctx, p, size, { lineWidth: band * STITCH.inner, strokeStyle: color })
}
