import { canUseWorker } from './useChevronPainter'

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
