import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fetchFromScriptTag from './fetchFromScriptTag'

const scripts = () => document.head.querySelectorAll('script')

describe('fetchFromScriptTag', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    document.head.innerHTML = ''
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves with the callback payload and cleans up', async () => {
    const pending = fetchFromScriptTag('https://x.test/a', 'cbA')
    expect(scripts()).toHaveLength(1)
    expect(scripts()[0].src).toBe('https://x.test/a')
    window.cbA(['ok'])
    await expect(pending).resolves.toEqual(['ok'])
    expect(scripts()).toHaveLength(0)
    expect('cbA' in window).toBe(false)
  })

  it('rejects and cleans up when the script fails to load', async () => {
    const pending = fetchFromScriptTag('https://x.test/b', 'cbB')
    scripts()[0].onerror()
    await expect(pending).rejects.toThrow(/script load failed/)
    expect(scripts()).toHaveLength(0)
    expect('cbB' in window).toBe(false)
  })

  it('rejects and cleans up on timeout', async () => {
    const pending = fetchFromScriptTag('https://x.test/c', 'cbC', { timeoutMs: 1000 })
    const assertion = expect(pending).rejects.toThrow(/timeout after 1000ms/)
    await vi.advanceTimersByTimeAsync(1001)
    await assertion
    expect(scripts()).toHaveLength(0)
    expect('cbC' in window).toBe(false)
  })

  it('defaults to a 5 second timeout', async () => {
    const pending = fetchFromScriptTag('https://x.test/d', 'cbD')
    const assertion = expect(pending).rejects.toThrow(/5000ms/)
    await vi.advanceTimersByTimeAsync(4999)
    expect(scripts()).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(2)
    await assertion
  })

  it('ignores a late callback after a timeout', async () => {
    const pending = fetchFromScriptTag('https://x.test/e', 'cbE', { timeoutMs: 10 })
    const assertion = expect(pending).rejects.toThrow()
    const late = window.cbE
    await vi.advanceTimersByTimeAsync(11)
    await assertion
    expect(() => late(['late'])).not.toThrow()
  })

  it('does not fire the timeout after a successful response', async () => {
    const pending = fetchFromScriptTag('https://x.test/f', 'cbF', { timeoutMs: 100 })
    window.cbF([1])
    await pending
    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps two in-flight requests apart', async () => {
    const first = fetchFromScriptTag('https://x.test/1', 'cb1')
    const second = fetchFromScriptTag('https://x.test/2', 'cb2')
    window.cb2(['second'])
    window.cb1(['first'])
    await expect(first).resolves.toEqual(['first'])
    await expect(second).resolves.toEqual(['second'])
  })

  it('refuses a callback name already in use without disturbing the owner', async () => {
    const owner = fetchFromScriptTag('https://x.test/own', 'cbDup')
    await expect(fetchFromScriptTag('https://x.test/dup', 'cbDup')).rejects.toThrow(/already in use/)
    expect(scripts()).toHaveLength(1)
    window.cbDup(['owner'])
    await expect(owner).resolves.toEqual(['owner'])
  })

  it('cleans up when the script cannot be inserted', async () => {
    const spy = vi.spyOn(document.head, 'appendChild').mockImplementation(() => { throw new Error('blocked') })
    await expect(fetchFromScriptTag('https://x.test/g', 'cbG')).rejects.toThrow('blocked')
    expect('cbG' in window).toBe(false)
    spy.mockRestore()
  })

  it('leaves no globals or nodes behind after many failed calls', async () => {
    for (let i = 0; i < 20; i++) {
      const pending = fetchFromScriptTag('https://x.test/h', `cbMany${i}`)
      scripts()[0].onerror()
      await expect(pending).rejects.toThrow()
    }
    expect(scripts()).toHaveLength(0)
    expect(Object.keys(window).filter(k => k.startsWith('cbMany'))).toEqual([])
  })
})
