import { describe, it, expect, vi } from 'vitest'
import { deepMerge, resolveSettings, pickChanged } from './resolveSettings'
import { SETTINGS_VERSION } from './settingsMigration'
import * as migration from './settingsMigration'

const defaults = {
  appearance: {
    glassmorphism: false,
    colorScheme: 'auto',
    activeTheme: 'default',
    themes: { default: { light: { primary: '#111' }, dark: { primary: '#eee' } } }
  },
  general: { locale: 'en', animationSpeed: 250 }
}

describe('deepMerge', () => {
  it('fills gaps from defaults without mutating inputs', () => {
    const defaults = { a: 1, nested: { x: 1, y: 2 } }
    const stored = { nested: { y: 99 } }
    const out = deepMerge(defaults, stored)
    expect(out).toEqual({ a: 1, nested: { x: 1, y: 99 } })
    // inputs untouched
    expect(defaults).toEqual({ a: 1, nested: { x: 1, y: 2 } })
    expect(stored).toEqual({ nested: { y: 99 } })
  })

  it('replaces arrays wholesale (does not merge element-wise)', () => {
    expect(deepMerge({ list: [1, 2, 3] }, { list: [9] })).toEqual({ list: [9] })
  })
})

describe('resolveSettings', () => {

  it('HOT PATH: current version skips migration + validation', () => {
    const migrateSpy = vi.spyOn(migration, 'migrateSettings')
    const validateSpy = vi.spyOn(migration, 'validateSettings')

    const { settings, needsVersionWrite } = resolveSettings(
      { general: { locale: 'fr' } }, SETTINGS_VERSION, defaults
    )

    expect(migrateSpy).not.toHaveBeenCalled()
    expect(validateSpy).not.toHaveBeenCalled()
    expect(needsVersionWrite).toBe(false)
    // still merges stored onto defaults
    expect(settings.general).toEqual({ locale: 'fr', animationSpeed: 250 })
    expect(settings.appearance.glassmorphism).toBe(false)

    migrateSpy.mockRestore()
    validateSpy.mockRestore()
  })

  it('COLD PATH: version mismatch runs migration and flags a version write', () => {
    const migrateSpy = vi.spyOn(migration, 'migrateSettings')
    const { needsVersionWrite } = resolveSettings({}, 1, defaults)
    expect(migrateSpy).toHaveBeenCalled()
    expect(needsVersionWrite).toBe(true)
    migrateSpy.mockRestore()
  })

  it('COLD PATH: undefined (pre-versioning) store triggers migration', () => {
    const migrateSpy = vi.spyOn(migration, 'migrateSettings')
    const { needsVersionWrite } = resolveSettings({}, undefined, defaults)
    expect(migrateSpy).toHaveBeenCalled()
    expect(needsVersionWrite).toBe(true)
    migrateSpy.mockRestore()
  })

  it('COLD PATH: applies the v2->v3 performanceMode->glassmorphism migration', () => {
    // Simulate a v2 store where performanceMode=false meant blur was ON.
    const { settings } = resolveSettings(
      { appearance: { performanceMode: false } }, 2, defaults
    )
    expect(settings.appearance.glassmorphism).toBe(true)
    expect(settings.appearance).not.toHaveProperty('performanceMode')
  })
})

const run = raw => resolveSettings(raw, SETTINGS_VERSION, defaults)

describe('corrupt or wrong-shaped payloads', () => {
  it.each([null, 'text', 42, [], [1, 2]])('falls back to defaults for a %j root', raw => {
    const { settings } = run(raw)
    expect(settings.general).toEqual(defaults.general)
  })

  it('drops values whose type disagrees with the default and keeps a backup', () => {
    const { settings } = run({ general: { locale: 7, animationSpeed: 'fast' }, appearance: 'nope' })
    expect(settings.general).toEqual(defaults.general)
    expect(settings.appearance.themes.default.light.primary).toBe('#111')
    const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i))
    expect(keys.some(k => k.startsWith('chevron.settings.bak'))).toBe(true)
  })

  it('repairs an active theme or scheme that does not exist', () => {
    const { settings } = run({ appearance: { activeTheme: 'gone', colorScheme: 'sepia' } })
    expect(settings.appearance.activeTheme).toBe('default')
    expect(settings.appearance.colorScheme).toBe('auto')
  })

  it('completes a user theme that lacks a scheme', () => {
    const { settings } = run({ appearance: { themes: { mine: { light: { primary: '#abc' } } } } })
    expect(settings.appearance.themes.mine.light.primary).toBe('#abc')
    expect(settings.appearance.themes.mine.dark.primary).toBe('#eee')
  })

  it('ignores prototype-polluting keys', () => {
    const { settings } = run(JSON.parse('{"__proto__": {"polluted": true}}'))
    expect(settings.polluted).toBeUndefined()
    expect({}.polluted).toBeUndefined()
  })
})

describe('v3 to v4 migration', () => {
  it('replaces the old default animation speed with the new default but keeps a custom one', () => {
    expect(resolveSettings({ general: { animationSpeed: 400 } }, 3, defaults).settings.general.animationSpeed).toBe(250)
    expect(resolveSettings({ general: { animationSpeed: 600 } }, 3, defaults).settings.general.animationSpeed).toBe(600)
  })
})

describe('pickChanged', () => {
  it('keeps only values that differ from defaults, including unknown keys', () => {
    const defaults = { a: 1, n: { x: 1, y: [1] } }
    expect(pickChanged(defaults, { a: 1, n: { x: 1, y: [1] } })).toEqual({})
    expect(pickChanged(defaults, { a: 2, n: { x: 1, y: [2] }, extra: 'k' })).toEqual({ a: 2, n: { y: [2] }, extra: 'k' })
  })
})
