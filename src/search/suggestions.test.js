import { describe, it, expect } from 'vitest'
import { macroSuggestions, mergeSuggestions, stepSelection, sameSuggestion, submitTarget } from './suggestions'

const macros = [
  { name: 'GitHub', triggers: ['gh', 'github', 'g'] },
  { name: 'Gmail', triggers: ['gm', 'gmail'] },
  { name: 'Reddit', triggers: ['r'] }
]

describe('macroSuggestions', () => {
  it('one entry per macro, with its shortest matching trigger', () => {
    expect(macroSuggestions('g', macros).map(s => [s.label, s.suggestion, s.exact])).toEqual([['GitHub', 'g', true], ['Gmail', 'gm', false]])
    expect(macroSuggestions('gi', macros).map(s => s.suggestion)).toEqual(['github'])
    expect(macroSuggestions('', macros)).toEqual([])
  })
})

describe('mergeSuggestions', () => {
  const isAnswer = t => t === 'calculator'

  it('orders answers, exact macros, history, other macros, then autocomplete', () => {
    const list = mergeSuggestions([
      [{ suggestion: 'gh pages', type: 'autocomplete', relevance: 900 }],
      [{ suggestion: 'gh stars', type: 'history', relevance: 30 }],
      macroSuggestions('g', macros),
      [{ suggestion: '42', type: 'calculator', relevance: 5000 }]
    ], isAnswer)
    expect(list.map(s => s.suggestion)).toEqual(['42', 'g', 'gh stars', 'gm', 'gh pages'])
  })

  it('keeps one entry per text, case-insensitively, the better tier winning', () => {
    const list = mergeSuggestions([
      [{ suggestion: 'Cats', type: 'autocomplete', relevance: 1 }],
      [{ suggestion: 'cats', type: 'history', relevance: 1 }]
    ])
    expect(list).toHaveLength(1)
    expect(list[0].type).toBe('history')
  })

  it('drops empty items', () => {
    expect(mergeSuggestions([[null, { suggestion: '', type: 'history' }]])).toEqual([])
  })
})

describe('stepSelection', () => {
  const list = [{ suggestion: 'a', type: 'x' }, { suggestion: 'b', type: 'x' }]

  it('walks down from the typed text and back to it past the end', () => {
    let s = stepSelection(list, null, 1)
    expect(s.suggestion).toBe('a')
    s = stepSelection(list, s, 1)
    expect(s.suggestion).toBe('b')
    expect(stepSelection(list, s, 1)).toBeNull()
  })

  it('walks up from the typed text to the last item', () => {
    expect(stepSelection(list, null, -1).suggestion).toBe('b')
    expect(stepSelection(list, list[0], -1)).toBeNull()
  })

  it('finds the current item by value, since lists are rebuilt per keystroke', () => {
    expect(stepSelection([...list], { suggestion: 'a', type: 'x' }, 1).suggestion).toBe('b')
    expect(sameSuggestion({ suggestion: 'a', type: 'x' }, { suggestion: 'a', type: 'y' })).toBe(false)
    expect(stepSelection([], null, 1)).toBeNull()
  })
})

describe('submitTarget', () => {
  const isAnswer = t => t === 'calculator'
  const answer = { suggestion: '4', type: 'calculator' }
  const other = { suggestion: '2+2 meaning', type: 'autocomplete' }

  it('prefers the highlighted suggestion', () => {
    expect(submitTarget('2+2', other, [answer, other], isAnswer)).toBe(other)
  })

  it('takes a top instant answer when nothing is highlighted', () => {
    expect(submitTarget('2+2', null, [answer, other], isAnswer)).toEqual(answer)
  })

  it('otherwise uses the typed text', () => {
    expect(submitTarget('cats', null, [other], isAnswer)).toEqual({ suggestion: 'cats' })
    expect(submitTarget('cats', null, [], isAnswer)).toEqual({ suggestion: 'cats' })
  })
})
