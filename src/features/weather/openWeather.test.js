import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchCurrentWeather, geocodeCity } from './openWeather'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('openWeather', () => {
  it('aborts a request that never answers instead of hanging', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', (url, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason))))
    const pending = fetchCurrentWeather(1, 2, 'metric', 'k', undefined)
    const caught = pending.catch(e => e)
    await vi.advanceTimersByTimeAsync(8001)
    expect((await caught).message).toMatch(/timed out/)
  })

  it('honours the caller signal', async () => {
    vi.stubGlobal('fetch', (url, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason))))
    const controller = new AbortController()
    const caught = geocodeCity('x', 'k', controller.signal).catch(e => e)
    controller.abort(new Error('stop'))
    expect((await caught).message).toBe('stop')
  })

  it('turns an HTTP error into a rejection', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 401 }))
    await expect(fetchCurrentWeather(1, 2, 'metric', 'k')).rejects.toThrow(/401/)
  })
})
