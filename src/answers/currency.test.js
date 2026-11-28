import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { clearCurrencyCache, currencyAnswer, looksLikeCurrency } from './currency'

function ratesResponse(rates, result = 'success') {
  return { json: async () => ({ result, rates }) }
}

const USD_RATES = { EUR: 0.9, GBP: 0.8, JPY: 150, USD: 1, BTC: 0.00001 }

describe('looksLikeCurrency', () => {
  it.each([
    'usd to eur', '100 usd to eur', '100usd to eur', '100 USD TO EUR', '100 usd in eur', '100 usd into eur', '100 usd as eur', 'what is 100 usd in eur',
    '1.5 usd to eur', '.5 usd to eur', '1,000 usd to eur', 'yen to usd', '5 bucks to euros', 'euro to dollar', '10 quid to yen', '$5 to eur', '$ 5 to eur',
    '€10 in usd', '£3 to jpy', '¥1000 to usd', '5 usd to £', 'bitcoin to usd', '100 gbp to $', '2 sterling to dollars', '3 rupees to yuan', 'cad to aud',
  ])('%j', query => {
    expect(looksLikeCurrency(query)).toBe(true)
  })

  it.each([
    '', 'usd', '100 usd', 'usd to', 'usd to usd', '100 usd to usd', 'apple to orange', 'iphone to android', 'how to center a div', 'the 1975 to 2024',
    '5 km to mi', '5 pounds to kg', '100 usd to', 'to eur', '$5', '$5 usd to eur', '€ to €', 'foo to bar', 'usd eur', '100 usd to eur and gbp',
    '1 usd to xyz', 'xyz to usd', 'time in tokyo', '2+2', '3pm london to tokyo', '12 usd 5 to eur', 'a to b', 'ps5 to pc',
  ])('not %j', query => {
    expect(looksLikeCurrency(query)).toBe(false)
  })
})

let fetchImpl

beforeEach(() => {
  clearCurrencyCache()
  fetchImpl = vi.fn(async () => ratesResponse(USD_RATES))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('currencyAnswer: conversion', () => {
  it('converts using the rate for the base currency', async () => {
    const answer = await currencyAnswer('100 usd to eur', { fetchImpl })
    expect(answer).toEqual({ suggestion: '90.00 EUR', type: 'currency', relevance: 5000, label: '1 USD = 0.9 EUR' })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(fetchImpl.mock.calls[0][0]).toBe('https://open.er-api.com/v6/latest/USD')
  })

  it.each([
    ['usd to eur', '0.90 EUR'], ['1 usd to jpy', '150.00 JPY'], ['2.5 usd to gbp', '2.00 GBP'], ['$100 to eur', '90.00 EUR'],
    ['100 bucks to euros', '90.00 EUR'], ['100 dollars in yen', '15000.00 JPY'], ['1,000 usd to eur', '900.00 EUR'], ['0.001 usd to eur', '0.0009 EUR'],
    ['100 usd to €', '90.00 EUR'], ['1 usd to btc', '0.00001 BTC'],
  ])('%s -> %s', async (query, expected) => {
    expect((await currencyAnswer(query, { fetchImpl })).suggestion).toBe(expected)
  })

  it('resolves informal names to the right base', async () => {
    await currencyAnswer('5 yen to usd', { fetchImpl })
    expect(fetchImpl.mock.calls[0][0]).toBe('https://open.er-api.com/v6/latest/JPY')
  })
})

describe('currencyAnswer: rate cache and network use', () => {
  it('caches rates per base currency for five minutes', async () => {
    vi.useFakeTimers()
    await currencyAnswer('1 usd to eur', { fetchImpl })
    await currencyAnswer('50 usd to gbp', { fetchImpl })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    await currencyAnswer('1 gbp to eur', { fetchImpl })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    vi.advanceTimersByTime(4 * 60 * 1000)
    await currencyAnswer('1 usd to eur', { fetchImpl })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    vi.advanceTimersByTime(61 * 1000)
    await currencyAnswer('1 usd to eur', { fetchImpl })
    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })

  it('does not touch the network for non-currency queries', async () => {
    expect(await currencyAnswer('how to center a div', { fetchImpl })).toBeNull()
    expect(await currencyAnswer('5 km to mi', { fetchImpl })).toBeNull()
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})

describe('currencyAnswer: failures', () => {
  it('returns null when the target has no rate', async () => {
    expect(await currencyAnswer('1 usd to zwl', { fetchImpl })).toBeNull()
  })

  it('returns null on an API error body, a non-success result, and network failure', async () => {
    fetchImpl.mockResolvedValueOnce(ratesResponse(null, 'error'))
    expect(await currencyAnswer('1 usd to eur', { fetchImpl })).toBeNull()
    fetchImpl.mockResolvedValueOnce({ json: async () => { throw new Error('bad json') } })
    expect(await currencyAnswer('1 usd to eur', { fetchImpl })).toBeNull()
    fetchImpl.mockRejectedValueOnce(new TypeError('offline'))
    expect(await currencyAnswer('1 usd to eur', { fetchImpl })).toBeNull()
  })

  it('does not cache failures', async () => {
    fetchImpl.mockResolvedValueOnce(ratesResponse(null, 'error'))
    await currencyAnswer('1 usd to eur', { fetchImpl })
    expect((await currencyAnswer('1 usd to eur', { fetchImpl })).suggestion).toBe('0.90 EUR')
  })
})

describe('currencyAnswer: aborts and timeouts', () => {
  it('rejects with AbortError when the caller aborts mid-flight', async () => {
    const controller = new AbortController()
    fetchImpl = vi.fn((url, { signal }) => new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
    }))
    const pending = currencyAnswer('1 usd to eur', { signal: controller.signal, fetchImpl })
    controller.abort()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('passes the caller abort to the request as a plain AbortError, not the abort event', async () => {
    const controller = new AbortController()
    let requestSignal
    fetchImpl = vi.fn((url, { signal }) => new Promise((resolve, reject) => {
      requestSignal = signal
      signal.addEventListener('abort', () => reject(signal.reason))
    }))
    const pending = currencyAnswer('1 usd to eur', { signal: controller.signal, fetchImpl })
    controller.abort()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    expect(requestSignal.reason.name).toBe('AbortError')
  })

  it('rejects at once when the signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(currencyAnswer('1 usd to eur', { signal: controller.signal, fetchImpl })).rejects.toMatchObject({ name: 'AbortError' })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('gives up after 5 seconds with no answer rather than an error', async () => {
    vi.useFakeTimers()
    fetchImpl = vi.fn((url, { signal }) => new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
    }))
    const pending = currencyAnswer('1 usd to eur', { fetchImpl })
    await vi.advanceTimersByTimeAsync(5001)
    expect(await pending).toBeNull()
  })

  it('stops listening to the caller signal once settled', async () => {
    const controller = new AbortController()
    const remove = vi.spyOn(controller.signal, 'removeEventListener')
    await currencyAnswer('1 usd to eur', { signal: controller.signal, fetchImpl })
    expect(remove).toHaveBeenCalledWith('abort', expect.any(Function))
  })
})
