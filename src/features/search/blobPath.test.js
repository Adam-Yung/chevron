import { describe, it, expect } from 'vitest'
import { blobPath } from './blobPath'

describe('blobPath', () => {
  it('runs from the top-left corner through the tip at mid-height to the bottom-left corner', () => {
    const { stroke, fill } = blobPath({ reach: 400, height: 800, top: 0.3, bottom: 0.4 })
    expect(stroke).toBe('M0,0 C0,320 400,240 400,400 C400,560 0,480 0,800')
    expect(fill).toBe(stroke + ' Z')
  })
})
