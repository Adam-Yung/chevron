import { describe, it, expect } from 'vitest'
import camelCaseToTitle from './camelCaseToTitle'
import getClasses from './getClasses'
import { getPropertyByPath, setPropertyByPath } from './propertyByPath'
import pseudoHash from './pseudoHash'
import randomHSLColor from './randomHSLColor'

describe('getClasses', () => {
  it.each([
    [['a', 'b'], 'a b'], [['a', false, 'b'], 'a b'], [['a', true], 'a'], [[], ''],
    [['a b', 'c'], 'a b c'],
  ])('%j -> %j', (args, expected) => {
    expect(getClasses(...args)).toBe(expected)
  })
})

describe('camelCaseToTitle', () => {
  it.each([
    ['timeFormat', false, 'time format'], ['timeFormat', true, 'Time format'], ['a', true, 'A'], ['searchEngineName', true, 'Search engine name'], ['', true, ''],
  ])('%s (%s) -> %s', (input, capitalize, expected) => {
    expect(camelCaseToTitle(input, capitalize)).toBe(expected)
  })
})

describe('propertyByPath', () => {
  it('reads nested properties and tolerates gaps', () => {
    const obj = { a: { b: { c: 1 } }, z: 0 }
    expect(getPropertyByPath(obj, 'a.b.c')).toBe(1)
    expect(getPropertyByPath(obj, 'a.x.c')).toBeUndefined()
    expect(getPropertyByPath(obj, 'z')).toBe(0)
    expect(getPropertyByPath(obj, '')).toBe(obj)
    expect(getPropertyByPath('str', 'a')).toBe('str')
  })

  it('writes nested properties', () => {
    const obj = { a: { b: {} } }
    setPropertyByPath(obj, 'a.b.c', 5)
    setPropertyByPath(obj, 'top', 1)
    expect(obj).toEqual({ a: { b: { c: 5 } }, top: 1 })
  })
})

describe('pseudoHash and randomHSLColor', () => {
  it('hashes by character code sum', () => {
    expect(pseudoHash('')).toBe(0)
    expect(pseudoHash('ab')).toBe(97 + 98)
    expect(pseudoHash('ba')).toBe(pseudoHash('ab'))
  })

  it('is deterministic and respects the dark flag', () => {
    expect(randomHSLColor('github')).toBe(randomHSLColor('github'))
    expect(randomHSLColor('github')).toMatch(/^hsl\([\d.]+,\d+%,70%\)$/)
    expect(randomHSLColor('github', true)).toMatch(/,40%\)$/)
  })

  it('returns raw components on request, with saturation inside 0-100', () => {
    for (const name of ['a', 'google', 'x'.repeat(50), '']) {
      const [, s, l] = randomHSLColor(name, false, false)
      expect(s).toBeGreaterThanOrEqual(0)
      expect(s).toBeLessThanOrEqual(100)
      expect(l).toBe(70)
    }
  })
})
