import { describe, it, expect, vi, beforeEach } from 'vitest'
import MiniSearch from 'minisearch'
import History from './history'

describe('History (lazy minisearch index)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('does NOT build the MiniSearch index in the constructor', () => {
    localStorage.setItem('history', JSON.stringify([{ id: 'github.com' }]))
    const addAllSpy = vi.spyOn(MiniSearch.prototype, 'addAll')

    // eslint-disable-next-line no-new
    new History()
    expect(addAllSpy).not.toHaveBeenCalled()

    addAllSpy.mockRestore()
  })

  it('builds the index lazily on first suggest() and returns matches', () => {
    localStorage.setItem(
      'history',
      JSON.stringify([{ id: 'github.com' }, { id: 'google.com' }])
    )
    const addAllSpy = vi.spyOn(MiniSearch.prototype, 'addAll')

    const h = new History()
    const results = h.suggest('github')
    expect(addAllSpy).toHaveBeenCalledTimes(1)
    expect(results.some(r => r.suggestion === 'github.com')).toBe(true)

    addAllSpy.mockRestore()
  })

  it('only builds the index once across multiple suggest() calls', () => {
    localStorage.setItem('history', JSON.stringify([{ id: 'example.com' }]))
    const addAllSpy = vi.spyOn(MiniSearch.prototype, 'addAll')

    const h = new History()
    h.suggest('exam')
    h.suggest('exampl')
    expect(addAllSpy).toHaveBeenCalledTimes(1)

    addAllSpy.mockRestore()
  })

  it('sync() does nothing to the index if it was never built', () => {
    localStorage.setItem('history', JSON.stringify([{ id: 'a.com' }]))
    const removeAllSpy = vi.spyOn(MiniSearch.prototype, 'removeAll')

    const h = new History()
    h.sync() // never typed → nothing to resync
    expect(removeAllSpy).not.toHaveBeenCalled()

    removeAllSpy.mockRestore()
  })

  it('sync() rebuilds the index after it has been built', () => {
    localStorage.setItem('history', JSON.stringify([{ id: 'a.com' }]))
    const h = new History()
    h.suggest('a') // build index

    const removeAllSpy = vi.spyOn(MiniSearch.prototype, 'removeAll')
    const addAllSpy = vi.spyOn(MiniSearch.prototype, 'addAll')
    h.sync()
    expect(removeAllSpy).toHaveBeenCalledTimes(1)
    expect(addAllSpy).toHaveBeenCalledTimes(1)

    removeAllSpy.mockRestore()
    addAllSpy.mockRestore()
  })
})
