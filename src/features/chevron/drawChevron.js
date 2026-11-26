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
  ctx.beginPath()
  // Both arms start at the tip, so their dashes stay in step when a morph lays one arm over the other (the menu's bar).
  ctx.moveTo(x(p[0]), y(p[1]))
  ctx.bezierCurveTo(x(p[2]), y(p[3]), x(p[4]), y(p[5]), x(p[6]), y(p[7]))
  ctx.moveTo(x(p[0]), y(p[1]))
  ctx.bezierCurveTo(x(p[8]), y(p[9]), x(p[10]), y(p[11]), x(p[12]), y(p[13]))
  ctx.lineJoin = 'round'
  const pass = (lineWidth, strokeStyle, dash = [], lineCap = 'round') => {
    ctx.setLineDash(dash)
    ctx.lineCap = lineCap
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = strokeStyle
    ctx.stroke()
  }
  pass(thickness * STITCH.shadow, 'rgba(0, 0, 0, 0.3)')
  pass(thickness, color)
  // Below this the two stitch lines merge into noise.
  if (thickness < STITCH.minThickness * scale) return
  // A dashed band with its middle painted back over leaves one dashed line inside each edge, without compositing layers.
  pass(thickness * STITCH.outer, thread, [thickness * STITCH.dash, thickness * STITCH.gap], 'butt')
  pass(thickness * STITCH.inner, color)
}

// Fractions of the thickness; index.html repeats them for the first-paint shell, which must look the same.
export const STITCH = { shadow: 1.2, outer: 0.7, inner: 0.56, dash: 0.3, gap: 0.2, minThickness: 12 }
