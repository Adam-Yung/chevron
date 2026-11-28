import { act, renderHook } from '@testing-library/react'

const setHeight = value => Object.defineProperty(window, 'innerHeight', { configurable: true, value })

describe('useViewportSize', () => {
  // A tab opened in the background can run the bundle before it has a size, and get one before anything listens for resizes.
  it('reads the size again when a component starts listening', async () => {
    vi.resetModules()
    setHeight(0)
    const { default: useViewportSize } = await import('./useViewportSize')
    setHeight(800)
    const { result } = renderHook(() => useViewportSize())
    await act(async () => {})
    expect(result.current.height).toBe(800)
  })
})

describe('useViewportSize resizes', () => {
  afterEach(() => vi.useRealTimers())

  it('reads once per frame and stops listening on unmount', async () => {
    vi.useFakeTimers()
    vi.resetModules()
    setHeight(600)
    const { default: useViewportSize } = await import('./useViewportSize')
    let renders = 0
    const { result, unmount } = renderHook(() => { renders += 1; return useViewportSize() })
    const before = renders
    setHeight(700)
    window.dispatchEvent(new Event('resize'))
    window.dispatchEvent(new Event('orientationchange'))
    document.dispatchEvent(new Event('visibilitychange'))
    act(() => { vi.advanceTimersByTime(50) })
    expect(result.current.height).toBe(700)
    expect(renders).toBe(before + 1)
    unmount()
    setHeight(900)
    window.dispatchEvent(new Event('resize'))
    act(() => { vi.advanceTimersByTime(50) })
    expect(renders).toBe(before + 1)
  })
})
