import { describe, it, expect } from 'vitest'
import { uniqueKey, replaceValue, patchValue, removeKey, renameKey } from './recordOps'

describe('recordOps', () => {
  it('uniqueKey appends a counter until free', () => {
    expect(uniqueKey({ a: 1, a1: 1 }, 'a')).toBe('a2')
    expect(uniqueKey(undefined, 'a')).toBe('a')
  })

  it('renameKey keeps the order of keys', () => {
    expect(Object.keys(renameKey({ a: 1, b: 2, c: 3 }, 'b', 'x'))).toEqual(['a', 'x', 'c'])
  })

  it('renameKey ignores empty and taken names', () => {
    const record = { a: 1, b: 2 }
    expect(renameKey(record, 'a', '')).toBe(record)
    expect(renameKey(record, 'a', 'b')).toBe(record)
  })

  it('patchValue merges into one body, even a missing one', () => {
    expect(patchValue({ a: { x: 1 }, b: null }, 'a', { y: 2 })).toEqual({ a: { x: 1, y: 2 }, b: null })
    expect(patchValue({ b: null }, 'b', { y: 2 })).toEqual({ b: { y: 2 } })
  })

  it('replaceValue and removeKey keep the other entries in place', () => {
    expect(replaceValue({ a: 1, b: 2 }, 'a', 9)).toEqual({ a: 9, b: 2 })
    expect(Object.keys(removeKey({ a: 1, b: 2, c: 3 }, 'b'))).toEqual(['a', 'c'])
  })
})
