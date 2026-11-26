import { describe, it, expect, vi, beforeEach } from 'vitest'
import { clearAutocompleteCache, fetchAutocomplete, peekAutocomplete, prefixFallback } from './autocomplete'
import { parseGoogleSuggestions } from './googleAutocomplete'

const items = q => [{ suggestion: q + ' one', type: 'autocomplete', relevance: 2 }, { suggestion: q + 'x', type: 'autocomplete', relevance: 1 }]

beforeEach(() => clearAutocompleteCache())

describe('autocomplete cache', () => {
  it('fetches once per query and locale', async () => {
    const fetcher = vi.fn(async q => items(q))
    await fetchAutocomplete('cat', 'en', fetcher)
    await fetchAutocomplete('cat', 'en', fetcher)
    await fetchAutocomplete('cat', 'de', fetcher)
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(peekAutocomplete('cat', 'en')).toHaveLength(2)
  })

  it('falls back to the longest cached prefix, narrowed to what still matches', async () => {
    await fetchAutocomplete('ca', 'en', async () => [{ suggestion: 'cat food' }, { suggestion: 'car' }])
    expect(prefixFallback('cat', 'en').map(s => s.suggestion)).toEqual(['cat food'])
    expect(prefixFallback('dog', 'en')).toEqual([])
  })

  it('does not cache failures', async () => {
    await expect(fetchAutocomplete('x', 'en', async () => { throw new Error('offline') })).rejects.toThrow('offline')
    expect(peekAutocomplete('x', 'en')).toBeNull()
  })
})

describe('parseGoogleSuggestions', () => {
  it('reads texts and relevance, drops calculator rows, flags navigation', () => {
    const res = ['q', ['q one', '= 4', 'q.com'], [], [], { 'google:suggesttype': ['QUERY', 'CALCULATOR', 'NAVIGATION'], 'google:suggestrelevance': [600, 900, 500] }]
    expect(parseGoogleSuggestions(res)).toEqual([
      { suggestion: 'q one', type: 'autocomplete', relevance: 600, navigation: false },
      { suggestion: 'q.com', type: 'autocomplete', relevance: 500, navigation: true }
    ])
  })

  it('survives malformed responses', () => {
    expect(parseGoogleSuggestions(null)).toEqual([])
    expect(parseGoogleSuggestions(['q', ['a'], [], [], null])).toEqual([{ suggestion: 'a', type: 'autocomplete', relevance: 0, navigation: false }])
  })
})
