import { renderHook } from '@testing-library/react'
import useChevronPainter, { canUseWorker } from './useChevronPainter'

const canvas = { transferControlToOffscreen() {} }

describe('canUseWorker', () => {
  beforeAll(() => { globalThis.OffscreenCanvas ??= class {} })

  // Safari and Firefox construct a worker from file:// without throwing and then never draw; the canvas, already transferred,
  // cannot be drawn from the page either, so the chevron is simply missing.
  it('keeps painting on the page for a local file', () => {
    expect(canUseWorker(canvas, 'file:')).toBe(false)
  })

  it('uses the worker over http', () => {
    expect(canUseWorker(canvas, 'https:')).toBe(true)
    expect(canUseWorker(canvas, 'http:')).toBe(true)
    expect(canUseWorker({}, 'https:')).toBe(false)
  })
})

const noop = () => {}

describe('useChevronPainter on the page', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('mounts one canvas, reports the first frame to the latest callback and cleans up', () => {
    const frames = []
    vi.stubGlobal('requestAnimationFrame', cb => frames.push(cb))
    vi.stubGlobal('OffscreenCanvas', undefined)
    const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({ clearRect: noop, beginPath: noop, moveTo: noop, bezierCurveTo: noop, setLineDash: noop, stroke: noop })
    const host = document.createElement('div')
    const hostRef = { current: host }
    const stages = [new Float32Array(15)]
    const first = vi.fn()
    const second = vi.fn()
    const props = { stages, stage: 0, color: '#000', thread: '#fff', thickness: 4, viewport: {} }
    const view = renderHook(p => useChevronPainter(hostRef, p), { initialProps: { ...props, onFirstFrame: first } })
    expect(host.querySelectorAll('canvas')).toHaveLength(1)
    const post = view.result.current
    view.rerender({ ...props, onFirstFrame: second })
    expect(view.result.current).toBe(post)
    frames.forEach(cb => cb(0))
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
    view.unmount()
    expect(host.querySelector('canvas')).toBeNull()
    spy.mockRestore()
  })
})
