/**
 * Stroke the two bezier arms described by `points` (normalised: x and y in 0..1 of the canvas, x offset so 0 is the centre) as a
 * sewn stripe: shadow, cloth, then a dashed stitch line along each edge.
 * @param {CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D} ctx
 * @param {Float32Array} p
 * @param {{ width: number, height: number, color: string, thread: string, thickness: number, scale?: number }} style
 *   `scale` is canvas pixels per CSS pixel; `thickness` is already in canvas pixels
 */
export function drawChevron(ctx, p, { width, height, color, thread, thickness, scale = 1 }) {
  const x = v => v * width + width / 2
  const y = v => v * height
  ctx.clearRect(0, 0, width, height)
  // Both arms start at the tip, so their dashes stay in step when a morph lays one arm over the other (the menu's bar).
  const arms = [[2, 3, 4, 5, 6, 7], [8, 9, 10, 11, 12, 13]]
  const trace = arm => {
    const [ax, ay, bx, by, cx, cy] = arm.map(i => p[i])
    ctx.beginPath()
    ctx.moveTo(x(p[0]), y(p[1]))
    ctx.bezierCurveTo(x(ax), y(ay), x(bx), y(by), x(cx), y(cy))
  }
  ctx.lineJoin = 'round'
  // The stage's width factor. The dash comes from the full thickness, so the stitches keep their length while the stripe narrows.
  const band = thickness * (p[14] ?? 1)
  const pass = (lineWidth, strokeStyle, dash = [], lineCap = 'round') => {
    ctx.setLineDash(dash)
    ctx.lineCap = lineCap
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = strokeStyle
    // One path per arm: GPU-rendered Firefox drops the end cap of a subpath that another one follows.
    for (const arm of arms) {
      trace(arm)
      ctx.stroke()
    }
  }
  pass(band * STITCH.shadow, 'rgba(0, 0, 0, 0.3)')
  pass(band, color)
  // Below this the two stitch lines merge into noise.
  if (thickness < STITCH.minThickness * scale) return
  // A dashed band with its middle painted back over leaves one dashed line inside each edge, without compositing layers.
  pass(band * STITCH.outer, thread, [thickness * STITCH.dash, thickness * STITCH.gap], 'butt')
  pass(band * STITCH.inner, color)
}

// Fractions of the thickness; index.html repeats them for the first-paint shell, which must look the same.
export const STITCH = { shadow: 1.2, outer: 0.7, inner: 0.56, dash: 0.3, gap: 0.2, minThickness: 12 }
