import { describe, it, expect } from 'vitest'
import Color, { apcaContrast } from './color'
import getContrast from './getContrast'

describe('Color parsing', () => {
  it.each([
    ['#fff', 'rgb(255, 255, 255)'], ['#000', 'rgb(0, 0, 0)'], ['#ff0000', 'rgb(255, 0, 0)'], ['#FF0000', 'rgb(255, 0, 0)'],
    ['  #00ff00  ', 'rgb(0, 255, 0)'], ['#0000ff', 'rgb(0, 0, 255)'], ['rgb(10, 20, 30)', 'rgb(10, 20, 30)'], ['rgb(10 20 30)', 'rgb(10, 20, 30)'],
    ['rgba(10, 20, 30, 0.5)', 'rgba(10, 20, 30, 0.5)'], ['rgba(10, 20, 30, 50%)', 'rgba(10, 20, 30, 0.5)'], ['#ff000080', 'rgba(255, 0, 0, 0.5019607843137255)'],
    ['#f008', 'rgba(255, 0, 0, 0.5333333333333333)'],
  ])('%s -> %s', (input, expected) => {
    expect(new Color(input).toString()).toBe(expected)
  })

  it.each(['', '#', '#ff', '#fffff', '#ggg', '#12345g', 'rgb(1,2)', 'rgb(a,b,c)', null, undefined])('rejects %j', input => {
    expect(() => new Color(input)).toThrow(/Could not parse color/)
    expect(() => Color.parse(input)).toThrow()
  })

  it('serialises to hex', () => {
    expect(new Color('rgb(255, 128, 0)').toString({ format: 'hex' })).toBe('#ff8000')
    expect(new Color('#abc').toString({ format: 'hex' })).toBe('#aabbcc')
  })

  it('accepts another Color', () => {
    expect(new Color(new Color('#123456')).toString({ format: 'hex' })).toBe('#123456')
  })
})

describe('Color.set (OKLCH lightness)', () => {
  it('lightens and darkens relative to the current lightness', () => {
    const base = new Color('#808080')
    const light = base.set({ 'lch.l': l => l + 20 })
    const dark = base.set({ 'lch.l': l => l - 20 })
    expect(getContrast('#000000', light.toString())).toBeGreaterThan(getContrast('#000000', dark.toString()))
  })

  it('accepts a constant lightness and clamps to the gamut', () => {
    expect(new Color('#808080').set({ 'lch.l': 100 }).toString({ format: 'hex' })).toBe('#ffffff')
    expect(new Color('#808080').set({ 'lch.l': 0 }).toString({ format: 'hex' })).toBe('#000000')
    expect(new Color('#808080').set({ 'lch.l': 500 }).toString({ format: 'hex' })).toBe('#ffffff')
  })

  it('keeps white and black fixed under no-op adjustment', () => {
    expect(new Color('#ffffff').set({ 'lch.l': l => l }).toString({ format: 'hex' })).toBe('#ffffff')
    expect(new Color('#000000').set({ 'lch.l': l => l }).toString({ format: 'hex' })).toBe('#000000')
  })
})

describe('APCA contrast', () => {
  it('is large for black on white and white on black', () => {
    expect(Math.abs(apcaContrast('#000000', '#ffffff'))).toBeGreaterThan(100)
    expect(Math.abs(apcaContrast('#ffffff', '#000000'))).toBeGreaterThan(100)
  })

  it('is signed by polarity', () => {
    expect(apcaContrast('#000000', '#ffffff')).toBeGreaterThan(0)
    expect(apcaContrast('#ffffff', '#000000')).toBeLessThan(0)
  })

  it('is zero for identical or unparseable colours', () => {
    expect(apcaContrast('#777777', '#777777')).toBe(0)
    expect(apcaContrast('not a colour', '#ffffff')).toBe(0)
  })

  it('ranks closer colours lower', () => {
    expect(Math.abs(apcaContrast('#777777', '#ffffff'))).toBeLessThan(Math.abs(apcaContrast('#000000', '#ffffff')))
  })

  it('Color#contrast matches apcaContrast(other, this)', () => {
    expect(new Color('#ffffff').contrast('#000000', 'APCA')).toBeCloseTo(apcaContrast('#000000', '#ffffff'), 10)
  })
})

describe('getContrast', () => {
  it('returns the magnitude with one candidate', () => {
    expect(getContrast('#ffffff', '#000000')).toBeGreaterThan(100)
  })

  it('picks the more legible of two candidates', () => {
    expect(getContrast('#ffffff', '#000000', '#eeeeee')).toBe('#000000')
    expect(getContrast('#000000', '#000000', '#ffffff')).toBe('#ffffff')
    expect(getContrast(new Color('#202020'), '#111111', '#f0f0f0')).toBe('#f0f0f0')
  })
})
