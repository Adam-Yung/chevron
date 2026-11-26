import { describe, it, expect } from 'vitest'
import { validateConfig } from './validateConfig'

const macro = (over = {}) => ({ name: 'GitHub', url: 'https://github.com', triggers: ['gh'], ...over })
const config = (macros, extra = {}) => ({ macros, commands: [], engines: {}, ...extra })

describe('validateConfig', () => {
  it('accepts a normal config', () => {
    expect(validateConfig(config([macro()]))).toEqual({ errors: [], warnings: [] })
  })

  it('names the macro and field for a forbidden URL scheme', () => {
    const { errors } = validateConfig(config([macro(), macro({ name: 'Evil', url: 'javascript:alert(1)' })]))
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/Macro "Evil" \(#2\), URL/)
  })

  it('names the command template of a macro', () => {
    const evil = macro({ commands: { go: { template: 'data:text/html,x' } } })
    expect(validateConfig(config([evil])).errors[0]).toMatch(/Macro "GitHub" \(#1\), command "go" template/)
  })

  it('names the engine and query type', () => {
    const engines = { g: { name: 'Google', types: { query: { template: 'vbscript:x' } } } }
    expect(validateConfig(config([], { engines })).errors[0]).toMatch(/Engine "Google" \(g\), query type "query" template/)
  })

  it('flags an empty name and an empty URL', () => {
    const { errors } = validateConfig(config([macro({ name: '', url: ' ' })]))
    expect(errors).toEqual([
      'Macro "unnamed" (#1): the name is empty.',
      'Macro "unnamed" (#1): the URL is empty.'
    ])
  })

  it('warns, without blocking, when two macros share a trigger', () => {
    const result = validateConfig(config([macro(), macro({ name: 'Other' })]))
    expect(result.errors).toEqual([])
    expect(result.warnings[0]).toMatch(/Trigger "gh" is used by Macro "GitHub" \(#1\) and Macro "Other" \(#2\)/)
  })
})
