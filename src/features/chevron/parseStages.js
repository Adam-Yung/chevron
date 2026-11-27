import { blobPoints, blobReach, CANVAS_OVERHANG } from '../search/blobPath'

const smoothing = 0.1
const stretchMultiplier = 8
// The blob's piping is half the chevron's thickness (QuickLook); the stripe narrows to it as it becomes the blob's edge.
const SEARCH_WIDTH = 0.5

/**
 * @param {number} size the chevron's size as a fraction of the canvas
 * @param {number[]} search the search stage: blobPoints() for the current viewport
 */
export default function parseStages(size, search = blobPoints({ reach: 0.5, height: 1, top: 0.3, bottom: 0.4 })) {
  const s = size
  const startX = 0.5 * s
  const startY = 0.5

  return [
    // Stage 0: Chevron V (straight lines - control points at start)
    new Float32Array([
      startX, startY,
      startX, startY, startX, startY, startX + (-0.5 * s), startY + (0.5 * s),
      startX, startY, startX, startY, startX + (-0.5 * s), startY + (-0.5 * s),
      1
    ]),
    // Stage 1: Smoothed V (slight curvature)
    new Float32Array([
      startX, startY,
      startX, startY + smoothing * s, startX + (-0.5 * s), startY + (0.5 * s), startX + (-0.5 * s), startY + (0.5 * s),
      startX, startY + (-smoothing * s), startX + (-0.5 * s), startY + (-0.5 * s), startX + (-0.5 * s), startY + (-0.5 * s),
      1
    ]),
    // Stage 2: the search blob's curve
    new Float32Array([...search, SEARCH_WIDTH]),
    // Stage 3: Flat (horizontal collapse)
    new Float32Array([
      startX, startY,
      startX, startY, startX + (-0.5 * s), startY, startX + (-0.5 * s), startY,
      startX, startY, startX + (-0.5 * s), startY, startX + (-0.5 * s), startY,
      1
    ]),
    // Stage 4: Stretched flat
    new Float32Array([
      0.5 * stretchMultiplier / 2 * s, startY,
      0.5 * stretchMultiplier / 2 * s, startY,
      0.5 * stretchMultiplier / 2 * s + (-0.5 * stretchMultiplier * s), startY,
      0.5 * stretchMultiplier / 2 * s + (-0.5 * stretchMultiplier * s), startY,
      0.5 * stretchMultiplier / 2 * s, startY,
      0.5 * stretchMultiplier / 2 * s + (-0.5 * stretchMultiplier * s), startY,
      0.5 * stretchMultiplier / 2 * s + (-0.5 * stretchMultiplier * s), startY,
      1
    ]),
    // Stage 5: the straight line on the screen edge that the search curve springs out of. The curve's own heights, no width.
    new Float32Array([...search.map((v, i) => (i % 2 ? v : 0)), 1])
  ]
}

/**
 * The stages for a viewport. The chevron keeps its size as a fraction of 2 x blobReach while the canvas is sized off the height.
 * A page that has no size yet (a tab loading in the background) gets the default shapes, never NaN points.
 * @param {{ width: number, height: number, size: number, top: number, bottom: number }} view
 */
export function stagesFor({ width, height, size, top, bottom }) {
  if (!width || !height) return parseStages(size / CANVAS_OVERHANG)
  const reach = blobReach(width, height)
  return parseStages(size * 2 * reach / (height * CANVAS_OVERHANG), blobPoints({ reach, height, top, bottom }))
}
