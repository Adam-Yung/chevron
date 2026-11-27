import { readFileSync } from 'node:fs'
import { drawChevron, STITCH } from './drawChevron'
import parseStages, { stagesFor } from './parseStages'
import { blobPoints } from '../search/blobPath'

function strokes(thickness, scale) {
  const done = []
  let dash = []
  const ctx = {
    clearRect() {}, beginPath() {}, moveTo() {}, bezierCurveTo() {},
    setLineDash(next) { dash = next },
    stroke() { done.push({ style: this.strokeStyle, width: this.lineWidth, dashed: dash.length > 0 }) }
  }
  drawChevron(ctx, parseStages(0.2)[0], { width: 100, height: 100, color: 'gold', thread: 'cream', thickness, scale })
  // Every pass strokes both arms; one entry per pass.
  return done.filter((_, i) => i % 2 === 0)
}

describe('drawChevron', () => {
  // GPU-rendered Firefox drops the round cap at the end of a subpath that another subpath follows: one arm ended square.
  it('never puts both arms in one path', () => {
    let starts = 0
    const perStroke = []
    const ctx = {
      clearRect() {}, bezierCurveTo() {}, setLineDash() {},
      beginPath() { starts = 0 }, moveTo() { starts += 1 }, stroke() { perStroke.push(starts) }
    }
    drawChevron(ctx, parseStages(0.2)[0], { width: 100, height: 100, color: 'gold', thread: 'cream', thickness: 30 })
    expect(perStroke).toEqual(Array(8).fill(1))
  })

  it('sews a stripe: shadow, cloth, dashed thread, then cloth over the middle', () => {
    const done = strokes(30)
    expect(done.map(s => s.style)).toEqual(['rgba(0, 0, 0, 0.3)', 'gold', 'cream', 'gold'])
    expect(done.map(s => s.dashed)).toEqual([false, false, true, false])
    expect(done[3].width).toBeLessThan(done[2].width)
  })

  it('leaves the stitch off a stripe too thin to carry it', () => {
    expect(strokes(STITCH.minThickness - 1).map(s => s.style)).toEqual(['rgba(0, 0, 0, 0.3)', 'gold'])
  })

  it('narrows to piping width as it becomes the search curve', () => {
    const [idle, search] = [0, 2].map(stage => {
      const widths = []
      const ctx = { clearRect() {}, beginPath() {}, moveTo() {}, bezierCurveTo() {}, setLineDash() {}, stroke() { widths.push(this.lineWidth) } }
      drawChevron(ctx, parseStages(0.2)[stage], { width: 100, height: 100, color: 'gold', thread: 'cream', thickness: 32 })
      return widths[2]
    })
    expect(idle).toBe(32)
    expect(search).toBe(16)
  })

  it('judges thinness in CSS pixels, so a dense screen agrees with the first-paint shell', () => {
    expect(strokes((STITCH.minThickness - 1) * 2, 2)).toHaveLength(2)
    expect(strokes(STITCH.minThickness * 2, 2)).toHaveLength(4)
  })

  it('has the same proportions as the first-paint shell in index.html', () => {
    const html = readFileSync('index.html', 'utf8')
    for (const key of ['shadow', 'outer', 'inner', 'dash', 'gap']) expect(html, key).toContain(`var(--t) * ${STITCH[key]})`)
    expect(html).toContain(`thickness < ${STITCH.minThickness}`)
  })
})

describe('the search stage', () => {
  it('is the blob curve it is given, so chevron and fill share one outline', () => {
    const points = blobPoints({ reach: 400, height: 800, top: 0.3, bottom: 0.4 })
    expect(Array.from(parseStages(0.2, points)[2])).toEqual([...new Float32Array(points), 0.5])
  })
})

describe('stages before the page has a size', () => {
  it('still draw a chevron: a zero viewport must not turn the points into NaN', () => {
    const stages = stagesFor({ width: 0, height: 0, size: 0.2, top: 0.3, bottom: 0.4 })
    for (const stage of stages) expect(Array.from(stage).every(Number.isFinite)).toBe(true)
    expect(stages[0][0]).toBeGreaterThan(0)
  })
})
