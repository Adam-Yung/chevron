import { act, renderHook } from '@testing-library/react'
import useAdaptiveFontSize from './useAdaptiveFontSize'

describe('useAdaptiveFontSize', () => {
  let resize
  let disconnected
  let context
  beforeEach(() => {
    disconnected = 0
    vi.stubGlobal('ResizeObserver', class {
      constructor(fn) { resize = fn }
      observe() {}
      disconnect() { disconnected += 1 }
    })
    // 10px per character at any size keeps the arithmetic readable.
    context = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ measureText: t => ({ width: t.length * 10 }) })
  })
  afterEach(() => {
    context.mockRestore()
    vi.unstubAllGlobals()
  })

  it('shrinks to the measured width, down to a floor, and follows resizes', () => {
    const el = document.createElement('div')
    el.style.cssText = 'font-size: 20px; padding-left: 5px; padding-right: 5px'
    let width = 210
    Object.defineProperty(el, 'clientWidth', { get: () => width })
    const { result, rerender, unmount } = renderHook(({ text }) => useAdaptiveFontSize(text, 4), { initialProps: { text: 'abcdefghij' } })
    expect(result.current[1]).toBe(4)
    const ref = result.current[0]
    act(() => { ref(el) })
    expect(result.current[1]).toBe(4)
    rerender({ text: 'a'.repeat(38) })
    expect(result.current[1]).toBeCloseTo(2, 5)
    rerender({ text: 'a'.repeat(1000) })
    expect(result.current[1]).toBeCloseTo(0.72, 5)
    rerender({ text: 'a'.repeat(38) })
    width = 105
    act(() => { resize() })
    expect(result.current[1]).toBeCloseTo(0.95, 5)
    expect(result.current[0]).toBe(ref)
    unmount()
    expect(disconnected).toBe(1)
  })
})
