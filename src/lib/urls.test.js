import { describe, it, expect } from 'vitest'
import ensureProtocol from './ensureProtocol'
import isValidUrl from './isValidURL'
import normaliseURL from './normaliseURL'

describe('ensureProtocol', () => {
  it.each([
    ['example.com', 'https://example.com'], ['https://example.com', 'https://example.com'], ['http://example.com', 'http://example.com'],
    ['www.example.com/a?b=1', 'https://www.example.com/a?b=1'], ['', 'https://'], ['ftp.example.com', 'https://ftp.example.com'],
  ])('%j', (input, expected) => {
    expect(ensureProtocol(input)).toBe(expected)
  })

  it('honours a different default protocol', () => {
    expect(ensureProtocol('example.com', 'http')).toBe('http://example.com')
    expect(ensureProtocol('https://example.com', 'http')).toBe('https://example.com')
  })
})

describe('isValidUrl', () => {
  it.each([
    'example.com', 'www.example.com', 'https://example.com', 'http://example.com/path', 'example.co.uk', 'sub.domain.example.org', 'example.com:8080',
    'example.com/a/b/c', 'example.com/a?x=1&y=2', 'example.com/#frag', '192.168.1.1', 'http://127.0.0.1:3000/x', 'EXAMPLE.COM', 'a-b.com', 'ftp://files.example.com',
    'example.com/path/to/file.html', 'example.com/a%20b', 'example.com?x=1',
  ])('valid: %s', url => {
    expect(isValidUrl(url)).toBe(true)
  })

  it.each([
    '', 'localhost', 'hello', 'hello world', 'how to center a div', 'example', '-a.com', 'http://', 'a.b', 'example.com/a b', '.com', 'ex ample.com', 'http:/example.com',
    'example..com', '2+2', '100 kg in lb', 'iphone 15',
  ])('invalid: %s', url => {
    expect(isValidUrl(url)).toBe(false)
  })
})

describe('normaliseURL', () => {
  it.each([
    ['example.com', 'example.com'], ['https://www.example.com/path?q=1', 'example.com'], ['http://sub.domain.example.com', 'example.com'],
    ['www.google.com', 'google.com'], ['mail.google.com/inbox', 'google.com'], ['https://example.com:8080/x', 'example.com'],
    ['a.b.c.example.org', 'example.org'], ['EXAMPLE.com', 'example.com'],
  ])('%s -> %s', (input, expected) => {
    expect(normaliseURL(input)).toBe(expected)
  })

  it.each(['', 'hello', 'how to center a div', 'localhost', '2+2'])('null for %j', input => {
    expect(normaliseURL(input)).toBeNull()
  })

  // Documents a known limit: only the last two labels are kept, so multi-part public suffixes lose the registrable name.
  it('keeps only the last two labels (co.uk collapses)', () => {
    expect(normaliseURL('www.bbc.co.uk')).toBe('co.uk')
  })
})

describe('isValidURL performance', () => {
  it('stays fast on long strings without a dot (it runs on every keystroke)', () => {
    const started = performance.now()
    for (const n of [30, 40, 200, 2000]) isValidUrl('x'.repeat(n))
    isValidUrl('a-'.repeat(500) + 'b')
    isValidUrl('a.'.repeat(500))
    expect(performance.now() - started).toBeLessThan(50)
  })
})
