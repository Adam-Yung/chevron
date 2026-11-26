import { describe, it, expect } from 'vitest'
import { calculate, calculatorAnswer, formatCalcResult } from './calculator'

describe('calculate: arithmetic', () => {
  it.each([
    ['2+2', 4], ['2 + 2', 4], ['10 - 3', 7], ['6 * 7', 42], ['8 / 2', 4], ['2 x 3', 6], ['2 × 3', 6], ['2x3', 6],
    ['6 ÷ 3', 2], ['2^10', 1024], ['2**3', 8], ['2^3^2', 512], ['-2^2', -4], ['2^-1', 0.5], ['(-2)^2', 4],
    ['1 + 2 * 3', 7], ['(1 + 2) * 3', 9], ['10 / 4', 2.5], ['2(3+1)', 8], ['(1+2)(3+4)', 21], ['3 * -2', -6],
    ['--3 + 1', 4], ['+3 + 1', 4], ['1 - -1', 2], ['.5 + .5', 1], ['1e3 + 1', 1001], ['100 − 1', 99],
    ['1 + 2 + 3 + 4 + 5', 15], ['2 * (3 + (4 * 5))', 46], ['7 / 2 * 2', 7],
  ])('%s = %s', (expr, expected) => {
    expect(calculate(expr)).toBeCloseTo(expected, 10)
  })
})

describe('calculate: functions, constants, factorial', () => {
  it.each([
    ['sqrt(16)', 4], ['cbrt(27)', 3], ['abs(-4.5)', 4.5], ['round(2.5)', 3], ['floor(2.9)', 2], ['ceil(2.1)', 3],
    ['sin(0)', 0], ['cos(0)', 1], ['tan(0)', 0], ['asin(1)', Math.PI / 2], ['acos(1)', 0], ['atan(1)', Math.PI / 4],
    ['log(1000)', 3], ['ln(e)', 1], ['exp(0)', 1], ['pi * 2', 2 * Math.PI], ['2 * pi', 2 * Math.PI], ['e ^ 2', Math.E ** 2],
    ['sin(pi/2)', 1], ['SQRT(9)', 3], ['sqrt(2)^2', 2], ['5!', 120], ['0!', 1], ['10!', 3628800], ['3! + 1', 7],
    ['2^3!', 64], ['(2+1)!', 6], ['170!', 7.257415616e306], ['sqrt(abs(-16)) + 1', 5], ['ln(exp(2))', 2],
  ])('%s', (expr, expected) => {
    const result = calculate(expr)
    expect(result).not.toBeNull()
    if (expected === 0) expect(result).toBeCloseTo(0, 10)
    else expect(result / expected).toBeCloseTo(1, 8)
  })

  it('snaps trig residue to an exact zero', () => {
    expect(calculate('sin(pi)')).toBe(0)
    expect(calculate('cos(pi/2)')).toBe(0)
  })
})

describe('calculate: percent', () => {
  it.each([
    ['200 * 15%', 30], ['80 + 15%', 92], ['80 - 20%', 64], ['100 + 10% + 10%', 121], ['50% * 80', 40], ['80 + 10', 90],
    ['1000 * 2.5%', 25], ['(80 + 20%) * 2', 192], ['5 + 50% * 2', 6],
  ])('%s = %s', (expr, expected) => {
    expect(calculate(expr)).toBeCloseTo(expected, 10)
  })
})

describe('calculate: must not answer', () => {
  it.each([
    '', '   ', '42', '3.14', 'pi', 'e', '-5', '(5)', '100%', '2pi', '5 e', 'x', 'sqrt', 'sqrt 16', 'sin(', 'sqrt()',
    '1 +', '+', '* 2', '2 3', '1 2 + 3', '(1 + 2', '1 + 2)', '()', '1/0', '0/0', '1 / (2 - 2)', 'sqrt(-1)', 'ln(0)', 'log(-1)',
    'asin(2)', '171!', '2.5!', '(-1)!', '10^1000', '9^9^9', '2024-11-25', '555-1234', '2020-2021', '12/25/2024', '9/11', '24/7',
    '0xff + 1', '0b101 + 1', 'how to center a div', 'iphone 15', 'the 1975', '2024 calendar', 'c++ tutorial', '1080p',
    'covid-19', 'windows 11', 'ps5', 'react 18 + 1', '5-star hotels', '1,000 + 1', 'constructor', 'toString(2)', '__proto__ + 1',
    '1.5.2 + 1', 'foo(1)', '2 + abc', 'sin 30', '1 + + +',
  ])('%j', expr => {
    expect(calculate(expr)).toBeNull()
  })

  it('survives absurd nesting and length', () => {
    expect(calculate('('.repeat(5000) + '1' + ')'.repeat(5000) + '+1')).toBeNull()
    expect(calculatorAnswer('1+'.repeat(100) + '1')).toBeNull()
  })
})

describe('formatCalcResult', () => {
  it.each([
    [0.1 + 0.2, '0.3'], [1 / 3, '0.3333333333'], [4, '4'], [-0, '0'], [1e21, '1e+21'], [123456789012, '123456789012'],
    [2 / 3, '0.6666666667'], [0.000001, '0.000001'], [1e-7, '1e-7'], [100 * 1.1, '110'], [-2.5, '-2.5'],
  ])('%s -> %s', (value, text) => {
    expect(formatCalcResult(value)).toBe(text)
  })
})

describe('calculatorAnswer', () => {
  it('builds an answer with the normalised expression as label', () => {
    expect(calculatorAnswer('What is 2+2?')).toEqual({ suggestion: '4', type: 'calculator', relevance: 5000, label: '2+2' })
  })

  it.each(['calc 3 * 3', 'calculate 3 * 3', "what's 3 * 3", '3 * 3 =', '3 * 3?', 'compute 3*3'])('%s', q => {
    expect(calculatorAnswer(q).suggestion).toBe('9')
  })

  it.each(['hello world', '42', '', 'line\n1+1'])('no answer for %j', q => {
    expect(calculatorAnswer(q)).toBeNull()
  })

  it('never throws on non-strings', () => {
    expect(calculatorAnswer(undefined)).toBeNull()
    expect(calculatorAnswer(null)).toBeNull()
    expect(calculatorAnswer(42)).toBeNull()
  })
})
