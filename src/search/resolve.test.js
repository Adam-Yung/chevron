import { describe, it, expect } from 'vitest'
import { findMacro, looksLikeUrl, resolveDestination } from './resolve'

const google = {
  name: 'Google', bgColor: { type: 'solid', color: '#aaa' }, textColor: '#fff',
  types: { query: { template: 'https://g.test/search?q={$}' }, calculator: { template: 'https://g.test/search?q={@}' } }
}
const config = {
  macros: [
    { name: 'YouTube', triggers: ['y', 'yt'], url: 'https://youtube.com', normalisedURL: 'youtube.com',
      commands: { search: { template: '{@}/results?search_query={$}' }, go: { template: 'https://youtu.be/{$}', description: 'go to video' } } },
    { name: 'Telegram', triggers: ['t', 'tg'], url: 'http://t.me', normalisedURL: 't.me', commands: { go: { template: '{@}/{$}' } } },
    { name: 'Translate', triggers: ['tr'], url: 'https://translate.test' }
  ],
  commands: [{ type: 'search', trigger: '?' }, { type: 'go', trigger: '/' }],
  engines: { google }
}
const resolve = (text, extra = {}) => resolveDestination(text, { config, engine: google, ...extra })

describe('resolveDestination', () => {
  it('searches ordinary text with the engine, encoding it', () => {
    expect(resolve('cats & dogs')).toMatchObject({ kind: 'search', url: 'https://g.test/search?q=cats%20%26%20dogs', marquee: 'Google' })
  })

  it('an exact trigger opens the macro', () => {
    expect(resolve('yt')).toMatchObject({ kind: 'macro', url: 'https://youtube.com', label: 'YouTube' })
  })

  it('an exact trigger wins over a shorter trigger that would parse as a command', () => {
    expect(resolve('tr')).toMatchObject({ kind: 'macro', label: 'Translate' })
  })

  it('trigger + command trigger + args runs the macro command', () => {
    expect(resolve('yt?lofi beats')).toMatchObject({ kind: 'command', url: 'https://youtube.com/results?search_query=lofi%20beats' })
    expect(resolve('y/abc')).toMatchObject({ kind: 'command', url: 'https://youtu.be/abc', label: 'go to video' })
    expect(resolve('tg/durov')).toMatchObject({ kind: 'command', url: 'http://t.me/durov', label: 'go' })
  })

  it('a command the macro does not define falls back to search', () => {
    expect(resolve('tg?x')).toMatchObject({ kind: 'search' })
  })

  it('text that merely starts with a trigger is a search', () => {
    expect(resolve('youtube dl')).toMatchObject({ kind: 'search' })
  })

  it('URLs open directly, styled as their macro when one owns the domain', () => {
    expect(resolve('example.com/a?b=1')).toMatchObject({ kind: 'url', url: 'example.com/a?b=1', label: 'go to', marquee: 'example.com' })
    expect(resolve('www.youtube.com/feed')).toMatchObject({ kind: 'url', label: 'YouTube' })
    expect(resolve('localhost:5173')).toMatchObject({ kind: 'url' })
  })

  it('Ctrl (forceEngine) searches even a trigger or a URL', () => {
    expect(resolve('yt', { forceEngine: true })).toMatchObject({ kind: 'search', url: 'https://g.test/search?q=yt' })
    expect(resolve('example.com', { forceEngine: true })).toMatchObject({ kind: 'search' })
  })

  it('an instant answer keeps its type and uses the typed query for engine templates', () => {
    const r = resolve('14', { type: 'calculator', origin: '2*7', isAnswer: t => t === 'calculator' })
    expect(r).toMatchObject({ kind: 'answer', label: 'calculator', url: 'https://g.test/search?q=2*7' })
  })

  it('survives a missing config or engine', () => {
    expect(resolveDestination('x', {})).toMatchObject({ kind: 'search', url: '' })
  })
})

describe('findMacro', () => {
  it('returns the command and its arguments, the bare macro, or null', () => {
    expect(findMacro('yt?x', config)).toMatchObject({ command: { type: 'search', args: 'x' } })
    expect(findMacro('yt', config).command).toBeNull()
    expect(findMacro('nothing here', config)).toBeNull()
    expect(findMacro('yt?x', undefined)).toBeNull()
  })

  it('prefers the longest trigger when several prefix the query', () => {
    expect(findMacro('yt?x', config).macro.name).toBe('YouTube')
  })
})

describe('looksLikeUrl', () => {
  it.each(['github.com', 'a.b.co/x', 'http://x.io', 'localhost', 'localhost:3000/a', '10.0.0.1:8080', 'https://example.com/?q=1', 'nodejs.org/en', 'https://node.js'])('%s is a URL', t => {
    expect(looksLikeUrl(t)).toBe(true)
  })
  it.each(['cats', 'node.js tutorial', 'node.js', 'setup.py', 'README.md', 'v1.2', 'c++', '3.14', 'hello world.com'])('%s is not', t => {
    expect(looksLikeUrl(t)).toBe(false)
  })
})
