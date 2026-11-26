import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { useContext } from 'react'

async function load(stored, version) {
  vi.resetModules()
  if (stored !== undefined) localStorage.setItem('settings', stored)
  if (version !== undefined) localStorage.setItem('chevron.settings.version', String(version))
  return import('./SettingsProvider')
}

function mount(mod) {
  const seen = {}
  function Probe() {
    seen.settings = useContext(mod.SettingsContext)
    seen.set = useContext(mod.SetSettingsContext)
    seen.theme = useContext(mod.ThemeContext)
    return null
  }
  const view = render(<mod.default><Probe /></mod.default>)
  return { seen, view }
}

const stored = () => JSON.parse(localStorage.getItem('settings'))

beforeEach(() => { vi.useRealTimers() })

describe('SettingsProvider boot', () => {
  it('boots on invalid JSON and keeps the raw text as a backup', async () => {
    const mod = await load('{broken', 4)
    const { seen } = mount(mod)
    expect(seen.settings.general.animationSpeed).toBe(250)
    expect(seen.theme.primary).toBeTruthy()
    const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i))
    expect(keys.some(k => k.startsWith('chevron.corrupt.settings.'))).toBe(true)
  })

  it('boots on wrong shapes', async () => {
    const mod = await load(JSON.stringify({ appearance: { themes: 'x', activeTheme: 5 }, general: [] }), 4)
    const { seen } = mount(mod)
    expect(seen.theme.primary).toBeTruthy()
    expect(seen.settings.general.tabTitle).toBe('Chevron')
  })

  it('applies the v4 migration to a v3 store and persists it', async () => {
    const mod = await load(JSON.stringify({ general: { animationSpeed: 400, locale: 'ja' } }), 3)
    vi.useFakeTimers()
    const { seen } = mount(mod)
    expect(seen.settings.general.animationSpeed).toBe(250)
    act(() => vi.advanceTimersByTime(400))
    expect(stored().general).toEqual({ locale: 'ja' })
    expect(localStorage.getItem('chevron.settings.version')).toBe('4')
  })
})

describe('SettingsProvider persistence', () => {
  it('debounces writes and stores only what differs from defaults', async () => {
    const mod = await load(undefined, 4)
    vi.useFakeTimers()
    const { seen } = mount(mod)
    act(() => vi.advanceTimersByTime(400))
    const spy = vi.spyOn(Storage.prototype, 'setItem')
    for (const n of [300, 350, 400]) {
      act(() => seen.set(c => ({ ...c, general: { ...c.general, animationSpeed: n } })))
    }
    expect(spy).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(400))
    expect(stored()).toEqual({ general: { animationSpeed: 400 } })
  })

  it('flushes a pending write on pagehide', async () => {
    const mod = await load(undefined, 4)
    vi.useFakeTimers()
    const { seen } = mount(mod)
    act(() => vi.advanceTimersByTime(400))
    act(() => seen.set(c => ({ ...c, general: { ...c.general, tabTitle: 'Hi' } })))
    expect(stored().general?.tabTitle).toBeUndefined()
    act(() => { window.dispatchEvent(new Event('pagehide')) })
    expect(stored().general.tabTitle).toBe('Hi')
  })
})
