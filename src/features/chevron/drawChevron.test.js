import { readFileSync } from 'node:fs'
import { drawChevron, STITCH } from './drawChevron'
import parseStages from './parseStages'

function strokes(thickness, scale) {
  const done = []
  let dash = []
  const ctx = {
    clearRect() {}, beginPath() {}, moveTo() {}, bezierCurveTo() {},
    setLineDash(next) { dash = next },
    stroke() { done.push({ style: this.strokeStyle, width: this.lineWidth, dashed: dash.length > 0 }) }
  }
  drawChevron(ctx, parseStages(0.2)[0], { width: 100, height: 100, color: 'gold', thread: 'cream', thickness, scale })
  return done
}

describe('drawChevron', () => {
  it('sews a stripe: shadow, cloth, dashed thread, then cloth over the middle', () => {
    const done = strokes(30)
    expect(done.map(s => s.style)).toEqual(['rgba(0, 0, 0, 0.3)', 'gold', 'cream', 'gold'])
    expect(done.map(s => s.dashed)).toEqual([false, false, true, false])
    expect(done[3].width).toBeLessThan(done[2].width)
  })

  it('leaves the stitch off a stripe too thin to carry it', () => {
    expect(strokes(STITCH.minThickness - 1).map(s => s.style)).toEqual(['rgba(0, 0, 0, 0.3)', 'gold'])
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
