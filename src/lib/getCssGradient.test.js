import { describe, it, expect } from 'vitest'
import getCssGradient, { feltColor } from './getCssGradient'

describe('getCssGradient', () => {
  it('returns a solid colour untouched', () => {
    expect(getCssGradient({ type: 'solid', color: '#123456' })).toBe('#123456')
  })

  it.each([
    [{ type: 'gradient', gradientType: 'linear', colors: ['red', 'blue'] }, 'linear-gradient(45deg,red,blue)'],
    [{ type: 'gradient', gradientType: 'linear', angle: 90, colors: ['red', 'blue'] }, 'linear-gradient(90deg,red,blue)'],
    [{ type: 'gradient', gradientType: 'linear', angle: 0, colors: ['red', 'blue'] }, 'linear-gradient(0deg,red,blue)'],
    [{ type: 'gradient', gradientType: 'linear', angle: 'to right', colors: ['red', 'blue'] }, 'linear-gradient(to right,red,blue)'],
    [{ type: 'gradient', gradientType: 'radial', colors: ['red', 'blue'] }, 'radial-gradient(red,blue)'],
    [{ type: 'gradient', gradientType: 'radial', angle: 'circle', colors: ['red', 'blue'] }, 'radial-gradient(circle,red,blue)'],
    [{ type: 'gradient', gradientType: 'linear', angle: 10, colors: ['red', 'green', 'blue'], stops: [0, 50, 100] }, 'linear-gradient(10deg,red 0%,green 50%,blue 100%)'],
    [{ type: 'gradient', gradientType: 'conic', colors: ['red'] }, 'conic-gradient(red)'],
  ])('%j', (options, expected) => {
    expect(getCssGradient(options)).toBe(expected)
  })

  it('does not mutate the colour list when adding stops', () => {
    const colors = ['red', 'blue']
    getCssGradient({ type: 'gradient', gradientType: 'linear', colors, stops: [0, 100] })
    expect(colors).toEqual(['red', 'blue'])
  })

  it('paints malformed colours transparent instead of crashing the render', () => {
    expect(getCssGradient({ type: 'image' })).toBe('transparent')
    expect(getCssGradient(undefined)).toBe('transparent')
    expect(getCssGradient({ type: 'gradient', gradientType: 'linear' })).toBe('transparent')
    expect(getCssGradient('#fff')).toBe('#fff')
  })
})

describe('feltColor', () => {
  it('takes a solid colour or the first stop of a gradient', () => {
    expect(feltColor({ type: 'solid', color: '#123456' })).toBe('#123456')
    expect(feltColor({ type: 'gradient', gradientType: 'linear', colors: ['red', 'blue'] })).toBe('red')
    expect(feltColor('#888')).toBe('#888')
  })

  it('is undefined for anything it cannot reduce to one colour', () => {
    expect(feltColor(undefined)).toBeUndefined()
    expect(feltColor({ type: 'gradient' })).toBeUndefined()
    expect(feltColor('linear-gradient(red,blue)')).toBeUndefined()
  })
})
