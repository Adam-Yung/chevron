import { describe, it, expect } from 'vitest'
import { blobPath, blobPoints, blobReach, CANVAS_OVERHANG } from './blobPath'

describe('blobPath', () => {
  it('runs from the top-left corner through the tip at mid-height to the bottom-left corner', () => {
    const fill = blobPath({ reach: 400, height: 800, top: 0.3, bottom: 0.4 })
    expect(fill).toBe('M0,0 C0,320 400,240 400,400 C400,560 0,480 0,800 Z')
  })
})

describe('blobPoints', () => {
  const blob = { reach: 400, height: 800, top: 0.3, bottom: 0.4 }

  // Morph units: over the canvas side, x from the screen edge, y from the canvas top (it overhangs the viewport equally).
  it('is the same curve as blobPath, as two arms from the tip, for the chevron to morph into', () => {
    const side = blob.height * CANVAS_OVERHANG
    const px = blobPoints(blob).map((v, i) => Math.round(v * side - (i % 2 ? (side - blob.height) / 2 : 0)) + 0)
    expect(px).toEqual([400, 400, 400, 560, 0, 480, 0, 800, 400, 240, 0, 320, 0, 0])
  })

  it('leaves the canvas room beyond the tip for the stripe, which would otherwise be cut flat', () => {
    expect(blobPoints(blob)[0] * blob.height * CANVAS_OVERHANG).toBeLessThan(blob.height * CANVAS_OVERHANG / 2 - 40)
  })

  it('reaches half the height in landscape and two fifths of the width in portrait, like --chev', () => {
    expect(blobReach(1280, 800)).toBe(400)
    expect(blobReach(800, 1200)).toBe(320)
  })
})
