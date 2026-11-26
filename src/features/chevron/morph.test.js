import { describe, it, expect } from 'vitest'
import { createMorph } from './morph'

function harness() {
  let t = 0
  const frames = []
  const drawn = []
  const morph = createMorph({
    stages: [[0, 0], [10, 10], [20, 0]],
    draw: p => drawn.push(Array.from(p)),
    raf: cb => frames.push(cb),
    now: () => t
  })
  const tick = ms => { t += ms; const cb = frames.shift(); cb?.() }
  return { morph, tick, drawn, frames }
}

describe('createMorph', () => {
  it('reaches the target stage at the end of the duration', () => {
    const h = harness()
    h.morph.morph(1, 100, 'linear')
    h.tick(50)
    expect(h.drawn.at(-1)).toEqual([5, 5])
    h.tick(50)
    expect(h.drawn.at(-1)).toEqual([10, 10])
    expect(h.frames).toHaveLength(0)
  })

  it('a new target mid-way retargets from the current shape with a single loop', () => {
    const h = harness()
    h.morph.morph(1, 100, 'linear')
    h.tick(50)
    h.morph.morph(2, 100, 'linear')
    expect(h.frames).toHaveLength(1)
    h.tick(100)
    expect(h.drawn.at(-1)).toEqual([20, 0])
    expect(h.frames).toHaveLength(0)
  })

  it('zero duration and snap draw the target at once', () => {
    const h = harness()
    h.morph.morph(2, 0, 'linear')
    expect(h.drawn.at(-1)).toEqual([20, 0])
    h.morph.snap(1)
    expect(h.drawn.at(-1)).toEqual([10, 10])
  })

  it('ignores unknown stages', () => {
    const h = harness()
    h.morph.morph(9, 100)
    expect(h.drawn).toHaveLength(0)
  })
})
