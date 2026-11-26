import { describe, it, expect, beforeEach } from 'vitest'
import { createHistory, HISTORY_KEY, HISTORY_LIMIT } from './history'
import { vi } from 'vitest'

function memoryStorage(initial) {
  const data = new Map(initial ? [[HISTORY_KEY, JSON.stringify(initial)]] : [])
  return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)), raw: () => JSON.parse(data.get(HISTORY_KEY)) }
}

let clock
const now = () => clock

beforeEach(() => { clock = 1_000_000_000_000 })

describe('history', () => {
  it('suggests prefix matches before word and substring matches, and never the exact query', () => {
    const h = createHistory({ storage: memoryStorage(), now })
    for (const q of ['react hooks', 'learn react', 'preact', 'react']) h.add(q)
    expect(h.suggest('react').map(s => s.suggestion)).toEqual(['react hooks', 'learn react', 'preact'])
  })

  it('matches every typed word against word starts', () => {
    const h = createHistory({ storage: memoryStorage(), now })
    h.add('new york weather')
    expect(h.suggest('wea new').map(s => s.suggestion)).toEqual(['new york weather'])
    expect(h.suggest('wea paris')).toEqual([])
  })

  it('ranks frequent and recent entries higher within the same kind of match', () => {
    const h = createHistory({ storage: memoryStorage(), now })
    h.add('cats video')
    clock += 30 * 86_400_000
    h.add('cats food')
    expect(h.suggest('cats')[0].suggestion).toBe('cats food')
    h.add('cats video'); h.add('cats video')
    expect(h.suggest('cats')[0].suggestion).toBe('cats video')
  })

  it('re-searching moves an entry to the front instead of duplicating it, ignoring case', () => {
    const storage = memoryStorage()
    const h = createHistory({ storage, now })
    h.add('Cats'); h.add('dogs'); h.add('cats')
    expect(storage.raw().map(e => [e.q, e.n])).toEqual([['cats', 2], ['dogs', 1]])
  })

  it('remove deletes an entry and persists', () => {
    const storage = memoryStorage()
    const h = createHistory({ storage, now })
    h.add('secret thing')
    expect(h.remove('SECRET THING')).toBe(true)
    expect(h.suggest('secret')).toEqual([])
    expect(storage.raw()).toEqual([])
    expect(h.remove('missing')).toBe(false)
  })

  it('migrates the old [{ id }] format', () => {
    const h = createHistory({ storage: memoryStorage([{ id: 'github stars', type: 'query' }, { id: null }]), now })
    expect(h.suggest('git').map(s => s.suggestion)).toEqual(['github stars'])
  })

  it('survives corrupt storage', () => {
    const storage = { getItem: () => '{not json', setItem: () => { throw new Error('quota') } }
    const h = createHistory({ storage, now })
    expect(h.suggest('x')).toEqual([])
    h.add('x y')
    expect(h.suggest('x').map(s => s.suggestion)).toEqual(['x y'])
  })

  it('keeps at most the limit, dropping the oldest', () => {
    const storage = memoryStorage()
    const h = createHistory({ storage, now })
    for (let i = 0; i <= HISTORY_LIMIT; i++) h.add('q' + i)
    expect(storage.raw()).toHaveLength(HISTORY_LIMIT)
    expect(storage.raw().at(-1).q).toBe('q1')
  })

  it('ignores blank queries', () => {
    const storage = memoryStorage()
    createHistory({ storage, now }).add('   ')
    expect(storage.getItem(HISTORY_KEY)).toBeNull()
  })

  it('replaces the snapshot and notifies subscribers on every change', () => {
    const h = createHistory({ storage: memoryStorage(), now })
    const before = h.snapshot()
    const listener = vi.fn()
    h.subscribe(listener)
    h.add('a')
    expect(h.snapshot()).not.toBe(before)
    h.remove('a')
    expect(listener).toHaveBeenCalledTimes(2)
  })
})
