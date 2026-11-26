import { createChevronPainter } from './chevronPainter'
import parseStages from './parseStages'

function fakeCanvas() {
  const noop = () => {}
  const ctx = { clearRect: noop, beginPath: noop, moveTo: noop, bezierCurveTo: noop, setLineDash: noop, stroke: noop }
  return { width: 0, height: 0, getContext: () => ctx }
}

function init() {
  return { type: 'init', width: 100, height: 100, color: '#000', thickness: 4, stage: 0, stages: parseStages(0.2).map(a => Array.from(a)) }
}

describe('createChevronPainter', () => {
  it('reports its first frame one frame after the first drawing', () => {
    const frames = []
    const onFirstFrame = vi.fn()
    const painter = createChevronPainter(fakeCanvas(), { raf: cb => frames.push(cb), now: () => 0 }, onFirstFrame)
    painter.postMessage(init())
    expect(onFirstFrame).not.toHaveBeenCalled()
    frames.forEach(cb => cb())
    expect(onFirstFrame).toHaveBeenCalledTimes(1)
  })

  it('works without a first-frame callback', () => {
    const painter = createChevronPainter(fakeCanvas(), { raf: cb => cb(), now: () => 0 })
    expect(() => painter.postMessage(init())).not.toThrow()
  })
})
