import { describe, it, expect, vi } from 'vitest'
import { saveConfig, resetConfig, loadConfig, CONFIG_EVENT, CONFIG_STORAGE_KEY } from './macrosConfig'

const good = { macros: [{ name: 'a', url: 'https://a.test' }], commands: [], engines: {} }

function countEvents() {
  const spy = vi.fn()
  window.addEventListener(CONFIG_EVENT, spy)
  return { spy, stop: () => window.removeEventListener(CONFIG_EVENT, spy) }
}

describe('config change event', () => {
  it('fires after a successful save, with window.CONFIG already updated', () => {
    const { spy, stop } = countEvents()
    spy.mockImplementation(() => expect(window.CONFIG.macros).toHaveLength(1))
    expect(saveConfig(good).ok).toBe(true)
    stop()
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('does not fire for a rejected save', () => {
    const { spy, stop } = countEvents()
    const result = saveConfig({ macros: [{ name: 'x', url: 'javascript:alert(1)' }] })
    stop()
    expect(result.ok).toBe(false)
    expect(spy).not.toHaveBeenCalled()
  })

  it('does not fire when storage rejects the write', () => {
    const { spy, stop } = countEvents()
    const original = localStorage.setItem
    localStorage.setItem = () => { throw new Error('quota') }
    const result = saveConfig(good)
    localStorage.setItem = original
    stop()
    expect(result.ok).toBe(false)
    expect(spy).not.toHaveBeenCalled()
  })

  it('fires on reset', () => {
    saveConfig(good)
    const { spy, stop } = countEvents()
    resetConfig()
    stop()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem(CONFIG_STORAGE_KEY)).toBeNull()
  })
})

describe('loadConfig', () => {
  it('ignores corrupt JSON and forbidden URLs', () => {
    localStorage.setItem(CONFIG_STORAGE_KEY, '{nope')
    expect(loadConfig().macros).toEqual(window.CONFIG.macros ?? [])
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ macros: [{ url: 'data:text/html,x' }] }))
    expect(loadConfig().macros.some(m => m.url?.startsWith('data:'))).toBe(false)
  })
})

describe('loadConfig with a forbidden URL', () => {
  it('backs the bad config up once, not on every load', () => {
    localStorage.clear()
    const bad = { version: 1, macros: [{ name: 'x', url: 'javascript:alert(1)', triggers: ['x'] }], commands: [], engines: {} }
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(bad))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    for (let i = 0; i < 3; i++) loadConfig()
    warn.mockRestore()
    const backups = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)).filter(k => k.startsWith('chevron.config.bak.'))
    expect(backups).toHaveLength(1)
  })
})
