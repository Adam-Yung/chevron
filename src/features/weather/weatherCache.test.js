import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearWeatherCache, getCachedCurrent, getCachedForecast, setCachedCurrent, setCachedForecast } from './weatherCache'

afterEach(() => vi.useRealTimers())

describe('weatherCache', () => {
  it('serves fresh data, then marks it stale after the TTL', () => {
    vi.useFakeTimers()
    setCachedCurrent({ name: 'Oslo' }, 'p')
    expect(getCachedCurrent('p')).toEqual({ stale: false, data: { name: 'Oslo' } })
    vi.advanceTimersByTime(11 * 60_000)
    expect(getCachedCurrent('p').stale).toBe(true)
  })

  it('keeps the forecast fresh longer than current conditions', () => {
    vi.useFakeTimers()
    setCachedForecast({ list: [] }, 'p')
    vi.advanceTimersByTime(30 * 60_000)
    expect(getCachedForecast('p').stale).toBe(false)
  })

  it('never returns data fetched for a different place', () => {
    setCachedCurrent({ name: 'Oslo' }, '59,10,metric')
    expect(getCachedCurrent('48,2,metric')).toBeNull()
  })

  it('survives corrupt storage and can be cleared', () => {
    localStorage.setItem('chevron.weather', '{not json')
    expect(getCachedCurrent('p')).toBeNull()
    setCachedCurrent({}, 'p')
    clearWeatherCache()
    expect(getCachedCurrent('p')).toBeNull()
  })
})
