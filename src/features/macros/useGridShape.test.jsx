import { act, renderHook } from '@testing-library/react'
import useGridShape from './useGridShape'
import useReducedMotion from '../stage/useReducedMotion'

vi.mock('../../lib/isMobile', () => ({ isTouch: true }))

function setMatches(media, listeners, matches) {
  media.matches = matches
  listeners.forEach(fn => fn({ matches }))
}

function fakeMedia(matches) {
  const listeners = new Set()
  const media = {
    matches,
    addEventListener: (_, fn) => listeners.add(fn),
    removeEventListener: (_, fn) => listeners.delete(fn)
  }
  return { media, listeners, set: setMatches.bind(null, media, listeners) }
}

describe('media queries that follow changes', () => {
  const original = window.matchMedia
  afterEach(() => { window.matchMedia = original })

  it('transposes the grid while a touch screen is portrait', () => {
    const fake = fakeMedia(true)
    window.matchMedia = vi.fn(() => fake.media)
    const { result, unmount } = renderHook(() => useGridShape(5, 2))
    expect(result.current).toEqual({ cols: 2, rows: 5 })
    act(() => { fake.set(false) })
    expect(result.current).toEqual({ cols: 5, rows: 2 })
    expect(window.matchMedia).toHaveBeenCalledWith('(orientation: portrait)')
    unmount()
    expect(fake.listeners.size).toBe(0)
  })

  it('follows the reduced-motion preference', () => {
    const fake = fakeMedia(false)
    window.matchMedia = vi.fn(() => fake.media)
    const { result, unmount } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
    act(() => { fake.set(true) })
    expect(result.current).toBe(true)
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
    unmount()
    expect(fake.listeners.size).toBe(0)
  })

  it('works where matchMedia is missing', () => {
    window.matchMedia = undefined
    expect(renderHook(() => useGridShape(4, 2)).result.current).toEqual({ cols: 4, rows: 2 })
    expect(renderHook(() => useReducedMotion()).result.current).toBe(false)
  })
})
