import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { SettingsContext } from '../settings/SettingsProvider'
import { clearCurrencyCache } from '../answers/currency'
import { clearAutocompleteCache } from './autocomplete'
import googleAutocomplete from './googleAutocomplete'
import useSuggestions, { NETWORK_DEBOUNCE_MS } from './useSuggestions'

vi.mock('./googleAutocomplete', () => ({ default: vi.fn() }))

const row = text => ({ suggestion: text, type: 'autocomplete', relevance: 1 })
const settingsWith = autocompleteLimit => ({ general: { locale: 'en', searchHistory: false }, query: { suggestions: { autocompleteLimit, historyLimit: 5 } } })

function wrapperFor(settings) {
  return function Wrapper({ children }) {
    return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>
  }
}

function render(query, autocompleteLimit = 5) {
  return renderHook(q => useSuggestions(q), { initialProps: query, wrapper: wrapperFor(settingsWith(autocompleteLimit)) })
}

const advance = ms => act(() => vi.advanceTimersByTimeAsync(ms))
const texts = result => result.current.map(s => s.suggestion)

beforeEach(() => {
  vi.useFakeTimers()
  clearAutocompleteCache()
  clearCurrencyCache()
  googleAutocomplete.mockReset()
  googleAutocomplete.mockImplementation(async q => [row(q + ' remote')])
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useSuggestions: when autocomplete is asked', () => {
  it('waits out the debounce before asking, then adds what arrives', async () => {
    const { result } = render('cats')
    await advance(NETWORK_DEBOUNCE_MS - 1)
    expect(googleAutocomplete).not.toHaveBeenCalled()
    await advance(1)
    expect(googleAutocomplete).toHaveBeenCalledWith('cats', 'en')
    expect(texts(result)).toEqual(['cats remote'])
  })

  it('asks once for a burst of keys', async () => {
    const { rerender } = render('c')
    await advance(50)
    rerender('ca')
    await advance(NETWORK_DEBOUNCE_MS)
    expect(googleAutocomplete.mock.calls.map(c => c[0])).toEqual(['ca'])
  })
})

describe('useSuggestions: what remote answers change', () => {
  it('never shows a slow response for an older query', async () => {
    let answerOld
    googleAutocomplete.mockImplementationOnce(() => new Promise(resolve => { answerOld = resolve }))
    const { result, rerender } = render('dogs')
    await advance(NETWORK_DEBOUNCE_MS)
    rerender('fish')
    await advance(NETWORK_DEBOUNCE_MS)
    await act(async () => answerOld([row('dogs late')]))
    expect(texts(result)).toEqual(['fish remote'])
  })

  it('shows a cached answer at once, without asking again', async () => {
    const { result, rerender } = render('cats')
    await advance(NETWORK_DEBOUNCE_MS)
    rerender('dogs')
    rerender('cats')
    expect(texts(result)).toEqual(['cats remote'])
    await advance(0)
    expect(texts(result)).toEqual(['cats remote'])
    expect(googleAutocomplete).toHaveBeenCalledTimes(1)
  })

  it('keeps the list empty when the request fails', async () => {
    googleAutocomplete.mockRejectedValueOnce(new Error('offline'))
    const { result } = render('cats')
    await advance(NETWORK_DEBOUNCE_MS)
    expect(result.current).toEqual([])
  })

  it('asks nothing when the limit is 0 or the query is empty', async () => {
    render('cats', 0)
    render('')
    await advance(NETWORK_DEBOUNCE_MS)
    expect(googleAutocomplete).not.toHaveBeenCalled()
  })
})

describe('useSuggestions: currency and list identity', () => {
  it('adds a currency answer above the autocomplete rows', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => ({ result: 'success', rates: { EUR: 0.9 } }) })))
    const { result } = render('100 usd to eur')
    await advance(NETWORK_DEBOUNCE_MS)
    expect(texts(result)).toEqual(['90.00 EUR', '100 usd to eur remote'])
  })

  it('aborts the currency request when the query changes', async () => {
    const fetch = vi.fn(() => new Promise(() => {}))
    vi.stubGlobal('fetch', fetch)
    const { rerender } = render('100 usd to eur')
    await advance(NETWORK_DEBOUNCE_MS)
    const { signal } = fetch.mock.calls[0][1]
    expect(signal.aborted).toBe(false)
    rerender('cats')
    expect(signal.aborted).toBe(true)
  })

  it('returns the same list while nothing changes', async () => {
    const { result, rerender } = render('cats')
    await advance(NETWORK_DEBOUNCE_MS)
    const before = result.current
    rerender('cats')
    expect(result.current).toBe(before)
  })
})
