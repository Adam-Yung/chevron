// The pure parts of services/install.cjs. The installer itself changes the machine's services, so no test runs it.
import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import serviceFiles from '../services/serviceFiles.cjs'

const { fillTemplate, unixVars, preferWindowsExecutable, platformKind } = serviceFiles

describe('fillTemplate', () => {
  it('replaces every occurrence of each placeholder, paths with spaces included', () => {
    expect(fillTemplate('{{A}} {{B}} {{A}} {{C}}', { A: '/my dir', B: 'x' })).toBe('/my dir x /my dir {{C}}')
  })

  it.each([
    ['com.chevron.preview.plist', { PROJECT_DIR: 'p', NPX_PATH: 'n', PATH: 'e' }],
    ['chevron-preview.service', { PROJECT_DIR: 'p', NPX_PATH: 'n', PATH: 'e' }],
    ['chevron-preview.xml', { PROJECT_DIR: 'p', NODE_EXE: 'n', VITE_JS: 'v' }]
  ])('leaves no placeholder in %s', (file, vars) => {
    expect(fillTemplate(readFileSync(`services/${file}`, 'utf8'), vars)).not.toContain('{{')
  })
})

describe('unixVars', () => {
  it('puts the npx folder first on the service PATH', () => {
    expect(unixVars('/my repo', '/opt/node/bin/npx')).toEqual({
      PROJECT_DIR: '/my repo', NPX_PATH: '/opt/node/bin/npx', PATH: '/opt/node/bin:/usr/local/bin:/usr/bin:/bin'
    })
  })
})

describe('preferWindowsExecutable', () => {
  it('prefers .exe, then .cmd, then the first match', () => {
    expect(preferWindowsExecutable(['n', 'n.CMD', 'n.EXE'])).toBe('n.EXE')
    expect(preferWindowsExecutable(['n', 'n.cmd'])).toBe('n.cmd')
    expect(preferWindowsExecutable(['n', 'n.ps1'])).toBe('n')
  })
})

describe('platformKind', () => {
  it('accepts Node platform names and the short ones', () => {
    expect(['darwin', 'mac', 'linux', 'win32', 'windows'].map(platformKind)).toEqual(['mac', 'mac', 'linux', 'windows', 'windows'])
    expect(platformKind('freebsd')).toBeNull()
  })
})
