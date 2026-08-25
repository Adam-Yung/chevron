const smoothing = 0.1
const stretchMultiplier = 8

export default function parseStages(size) {
  const s = size
  const startX = 0.5 * s
  const startY = 0.5

  return [
    // Stage 0: Chevron V (straight lines - control points at start)
    new Float32Array([
      startX, startY,
      startX, startY, startX, startY, startX + (-0.5 * s), startY + (0.5 * s),
      startX, startY, startX, startY, startX + (-0.5 * s), startY + (-0.5 * s)
    ]),
    // Stage 1: Smoothed V (slight curvature)
    new Float32Array([
      startX, startY,
      startX, startY + smoothing * s, startX + (-0.5 * s), startY + (0.5 * s), startX + (-0.5 * s), startY + (0.5 * s),
      startX, startY + (-smoothing * s), startX + (-0.5 * s), startY + (-0.5 * s), startX + (-0.5 * s), startY + (-0.5 * s)
    ]),
    // Stage 2: Curve (vertical, no size scaling)
    new Float32Array([
      0, 0.5,
      0, 0.5 + smoothing * 2, 0, 0.5 + 0.5, 0, 0.5 + 0.5,
      0, 0.5 - smoothing * 2, 0, 0.5 - 0.5, 0, 0.5 - 0.5
    ]),
    // Stage 3: Flat (horizontal collapse)
    new Float32Array([
      startX, startY,
      startX, startY, startX + (-0.5 * s), startY, startX + (-0.5 * s), startY,
      startX, startY, startX + (-0.5 * s), startY, startX + (-0.5 * s), startY
    ]),
    // Stage 4: Stretched flat
    new Float32Array([
      0.5 * stretchMultiplier / 2 * s, startY,
      0.5 * stretchMultiplier / 2 * s, startY,
      0.5 * stretchMultiplier / 2 * s + (-0.5 * stretchMultiplier * s), startY,
      0.5 * stretchMultiplier / 2 * s + (-0.5 * stretchMultiplier * s), startY,
      0.5 * stretchMultiplier / 2 * s, startY,
      0.5 * stretchMultiplier / 2 * s + (-0.5 * stretchMultiplier * s), startY,
      0.5 * stretchMultiplier / 2 * s + (-0.5 * stretchMultiplier * s), startY
    ])
  ]
}
