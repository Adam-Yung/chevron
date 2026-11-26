import { describe, it, expect } from 'vitest'
import LocalStorageObject from './localStorageObject'
import SettingsStorage from './settingsStorage'

const keys = () => Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i))

describe('LocalStorageObject', () => {
  it('seeds a missing key with the default', () => {
    const o = new LocalStorageObject('thing', { a: 1 })
    expect(o.object).toEqual({ a: 1 })
    expect(JSON.parse(localStorage.getItem('thing'))).toEqual({ a: 1 })
  })

  it('survives invalid JSON: parks the raw text and starts from the default', () => {
    localStorage.setItem('thing', '{not json')
    const o = new LocalStorageObject('thing', { a: 1 })
    expect(o.object).toEqual({ a: 1 })
    const parked = keys().find(k => k.startsWith('chevron.corrupt.thing.'))
    expect(localStorage.getItem(parked)).toBe('{not json')
  })

  it('survives a storage that throws', () => {
    const original = localStorage.getItem
    localStorage.getItem = () => { throw new Error('blocked') }
    try {
      expect(new LocalStorageObject('thing', { a: 1 }).object).toEqual({ a: 1 })
    } finally {
      localStorage.getItem = original
    }
  })
})

describe('settings storage', () => {
  it('obfuscates API keys at rest and restores them on load', () => {
    new SettingsStorage().set({ weather: { apiKey: 'abcdef' }, query: { AI: { apiKey: 'sk-secret' } } })
    const raw = localStorage.getItem('settings')
    expect(raw).not.toContain('abcdef')
    expect(raw).not.toContain('sk-secret')
    expect(new SettingsStorage().object.weather.apiKey).toBe('abcdef')
  })

  it('does not throw when the write is rejected', () => {
    const storage = new SettingsStorage()
    const original = localStorage.setItem
    localStorage.setItem = () => { throw new Error('quota') }
    try {
      expect(() => storage.set({ a: 1 })).not.toThrow()
    } finally {
      localStorage.setItem = original
    }
  })
})
