/**
 * Stroke the two bezier arms described by `points` (normalised: x and y in 0..1 of the canvas, x offset so 0 is the centre).
 * @param {CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D} ctx
 * @param {Float32Array} p
 * @param {{ width: number, height: number, color: string, thickness: number }} style
 */
export function drawChevron(ctx, p, { width, height, color, thickness }) {
  const x = v => v * width + width / 2
  const y = v => v * height
  ctx.clearRect(0, 0, width, height)
  ctx.beginPath()
  ctx.moveTo(x(p[0]), y(p[1]))
  ctx.bezierCurveTo(x(p[2]), y(p[3]), x(p[4]), y(p[5]), x(p[6]), y(p[7]))
  ctx.moveTo(x(p[0]), y(p[1]))
  ctx.bezierCurveTo(x(p[8]), y(p[9]), x(p[10]), y(p[11]), x(p[12]), y(p[13]))
  ctx.lineWidth = thickness
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = color
  ctx.stroke()
}
