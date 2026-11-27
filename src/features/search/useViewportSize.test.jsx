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
