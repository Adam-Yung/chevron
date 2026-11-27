import { spring, SPRING_CSS } from './searchMotion'
import { stagesFor } from './parseStages'
import { CANVAS_OVERHANG } from '../search/blobPath'

const samples = Array.from({ length: 201 }, (_, i) => spring(i / 200))
const view = { width: 1280, height: 800, size: 0.2, top: 0.3, bottom: 0.4 }

describe('the bounce into the search curve', () => {
  it('starts at rest, swings well past, swings back, and ends exactly on the curve', () => {
    expect(samples[0]).toBe(0)
    expect(samples[1]).toBeLessThan(0.01)
    expect(Math.max(...samples)).toBeGreaterThan(1.18)
    expect(Math.max(...samples)).toBeLessThan(1.3)
    expect(Math.min(...samples.slice(80))).toBeLessThan(0.97)
    expect(samples.at(-1)).toBe(1)
  })

  it('gives the stylesheet the same curve', () => {
    const values = SPRING_CSS.slice('linear('.length, -1).split(',').map(Number)
    values.forEach((value, i) => expect(value).toBeCloseTo(spring(i / (values.length - 1)), 3))
  })

  // From the line to the curve only x changes, which is what lets the fill follow with a horizontal scale.
  it('starts from a straight line on the edge with the same heights as the curve', () => {
    const stages = stagesFor(view)
    const curve = stages[2]
    const line = stages[5]
    for (let i = 0; i < 14; i++) expect(line[i]).toBe(i % 2 ? curve[i] : 0)
  })

  it('leaves the canvas room for the furthest swing', () => {
    const peakTip = stagesFor(view)[2][0] * Math.max(...samples) * view.height * CANVAS_OVERHANG
    expect(peakTip).toBeLessThan(view.height * CANVAS_OVERHANG / 2 - 20)
  })
})
