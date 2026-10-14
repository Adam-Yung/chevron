import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useClock from './useClock'

describe('useClock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Start at a known instant 500ms past a second boundary.
    vi.setSystemTime(new Date('2026-01-01T00:00:00.500Z'))
    // Default to a visible tab.
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible'
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('aligns the first tick to the next whole second (not a fixed 1000ms)', () => {
    const { result } = renderHook(() => useClock())
    const start = result.current.getTime()

    // 499ms is not enough to reach the boundary at .000.
    act(() => { vi.advanceTimersByTime(499) })
    expect(result.current.getTime()).toBe(start)

    // Crossing the boundary (500ms total) triggers the aligned tick.
    act(() => { vi.advanceTimersByTime(1) })
    expect(result.current.getTime()).toBe(new Date('2026-01-01T00:00:01.000Z').getTime())
  })

  it('ticks once per second after the first aligned tick', () => {
    const { result } = renderHook(() => useClock())
    act(() => { vi.advanceTimersByTime(500) }) // to :01.000
    act(() => { vi.advanceTimersByTime(1000) }) // to :02.000
    expect(result.current.getTime()).toBe(new Date('2026-01-01T00:00:02.000Z').getTime())
  })

  it('pauses while hidden and resumes on visibility', () => {
    let visibility = 'visible'
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibility
    })

    const { result } = renderHook(() => useClock())
    act(() => { vi.advanceTimersByTime(500) }) // :01.000
    const afterFirst = result.current.getTime()

    // Go hidden — advancing time should NOT update while paused.
    act(() => {
      visibility = 'hidden'
      document.dispatchEvent(new Event('visibilitychange'))
    })
    act(() => { vi.advanceTimersByTime(5000) })
    expect(result.current.getTime()).toBe(afterFirst)

    // Become visible again — snaps to current time immediately.
    vi.setSystemTime(new Date('2026-01-01T00:00:30.250Z'))
    act(() => {
      visibility = 'visible'
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(result.current.getTime()).toBe(new Date('2026-01-01T00:00:30.250Z').getTime())
  })

  it('clears its timer on unmount', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout')
    const { unmount } = renderHook(() => useClock())
    unmount()
    expect(clearSpy).toHaveBeenCalled()
  })
})
