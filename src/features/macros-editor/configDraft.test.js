import { describe, it, expect } from 'vitest'
import { parseRawConfig, importConfig, summarise, normaliseConfig } from './configDraft'

const base = { macros: [{ name: 'A' }], commands: [], engines: { g: { name: 'G' } } }

describe('parseRawConfig', () => {
  it('reports invalid JSON', () => {
    expect(parseRawConfig('{ nope').error).toMatch(/^Invalid JSON/)
  })

  it('rejects a missing section instead of treating it as empty', () => {
    const { config, error } = parseRawConfig('{"macros": [], "commands": []}')
    expect(config).toBeNull()
    expect(error).toMatch(/"engines" must be an object/)
  })

  it('rejects an array at the top level', () => {
    expect(parseRawConfig('[]').error).toMatch(/top level/)
  })

  it('accepts a complete config', () => {
    expect(parseRawConfig(JSON.stringify(base)).config).toEqual(base)
  })
})

describe('importConfig', () => {
  it('keeps current sections the file omits and ignores the version key', () => {
    const { config } = importConfig(base, { version: 1, macros: [] })
    expect(config).toEqual({ macros: [], commands: [], engines: base.engines })
  })

  it('names the section with the wrong type', () => {
    expect(importConfig(base, { engines: [] }).error).toMatch(/"engines"/)
  })

  it('rejects non-objects', () => {
    expect(importConfig(base, 5).error).toBeTruthy()
  })
})

describe('summarise / normaliseConfig', () => {
  it('pluralises counts', () => {
    expect(summarise(base)).toBe('1 macro, 0 commands, 1 engine.')
  })

  it('survives garbage', () => {
    expect(normaliseConfig(null)).toEqual({ macros: [], commands: [], engines: {} })
  })
})
