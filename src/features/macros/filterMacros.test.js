import { describe, it, expect } from 'vitest'
import { filterMacros, keyLabel, scoreMacro } from './filterMacros'

const macros = [
  { name: 'GitHub', triggers: ['gh'], category: 'Dev' },
  { name: 'Gmail', triggers: ['gm'], category: 'Mail' },
  { name: 'Digital Ocean', triggers: ['do'], category: 'Dev' },
  { name: 'Reddit', triggers: ['r'], category: 'Social' }
]

describe('filterMacros', () => {
  it('returns everything in config order for an empty filter', () => {
    expect(filterMacros(macros, '  ')).toBe(macros)
  })

  it('ranks name prefix over trigger over substring over category', () => {
    expect(filterMacros(macros, 'g').map(m => m.name)).toEqual(['GitHub', 'Gmail', 'Digital Ocean'])
    expect(filterMacros(macros, 'dev').map(m => m.name)).toEqual(['GitHub', 'Digital Ocean'])
    expect(filterMacros(macros, 'zzz')).toEqual([])
  })

  it('scores an exact name highest', () => {
    expect(scoreMacro(macros[0], 'github')).toBe(100)
  })
})

describe('keyLabel', () => {
  it('strips the KeyboardEvent.code prefix', () => {
    expect(keyLabel('KeyG')).toBe('G')
    expect(keyLabel('Digit3')).toBe('3')
    expect(keyLabel(undefined)).toBe('')
  })
})
