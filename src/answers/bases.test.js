import { describe, it, expect } from 'vitest'
import { baseAnswer } from './bases'

describe('baseAnswer', () => {
  it.each([
    ['255 in hex', '0xff'], ['255 to hex', '0xff'], ['255 in hexadecimal', '0xff'], ['255 IN HEX', '0xff'], ['0xff in decimal', '255'],
    ['0xFF in dec', '255'], ['0b1010 to dec', '10'], ['0b1010 in hex', '0xa'], ['255 in binary', '0b11111111'], ['255 in bin', '0b11111111'],
    ['8 in octal', '0o10'], ['0o17 to decimal', '15'], ['0o17 in binary', '0b1111'], ['0 in hex', '0x0'], ['-255 in hex', '-0xff'],
    ['-0xff in dec', '-255'], ['255 in base 2', '0b11111111'], ['255 in base 36', '73'], ['255 in base 7', '513'], ['255 into hex', '0xff'],
    ['what is 255 in hex', '0xff'], ['255 in hex?', '0xff'], ['4294967296 in hex', '0x100000000'], ['0xffffffffffffffffffff in dec', '1208925819614629174706175'],
    ['0x10 to bin', '0b10000'], ['1 in bin', '0b1'], ['10 as hex', '0xa'], ['0b0 to dec', '0'],
  ])('%s -> %s', (query, expected) => {
    expect(baseAnswer(query)).toMatchObject({ suggestion: expected, type: 'base', relevance: 5000 })
  })

  it.each([
    '255 in decimal', '0xff in hex', 'ff in decimal', 'ff in hex', '255 in base 1', '255 in base 37', '255 in base 99', '1.5 in hex',
    'hex', '255 hex', 'in octal', '0xzz in dec', '0b102 in dec', '0o9 in dec', `${'9'.repeat(41)} in hex`, 'convert in hex', 'how to convert 5 in hex pls',
    '', '255 in', 'hex to dec', '5 km in hex',
  ])('no answer for %j', query => {
    expect(baseAnswer(query)).toBeNull()
  })

  it('names the source base in the label', () => {
    expect(baseAnswer('255 in hex').label).toBe('255 (decimal)')
    expect(baseAnswer('0xff in dec').label).toBe('0xff (hex)')
  })
})
