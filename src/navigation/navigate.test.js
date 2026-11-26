import { describe, it, expect, vi } from 'vitest'
import { openDestination, toHref } from './navigate'

describe('toHref', () => {
  it.each([
    ['github.com', 'https://github.com'],
    ['github.com/foo?x=1', 'https://github.com/foo?x=1'],
    ['https://a.b/c', 'https://a.b/c'],
    ['http://a.b', 'http://a.b'],
    ['localhost:3000', 'http://localhost:3000'],
    ['192.168.1.4:8080/x', 'http://192.168.1.4:8080/x'],
    ['mailto:a@b.c', 'mailto:a@b.c'],
    ['  example.com ', 'https://example.com']
  ])('%s -> %s', (input, expected) => {
    expect(toHref(input)).toBe(expected)
  })

  it.each(['javascript:alert(1)', ' JavaScript:x', 'data:text/html,x', 'vbscript:x', 'file:///etc/passwd', '', null, undefined])(
    'refuses %s', input => {
      expect(toHref(input)).toBeNull()
    })
})

describe('openDestination', () => {
  const fakeWindow = () => ({ open: vi.fn(() => null), location: { assign: vi.fn() } })

  it('same tab assigns location and reports leaving', () => {
    const win = fakeWindow()
    expect(openDestination('example.com', { win })).toBe('leaving')
    expect(win.location.assign).toHaveBeenCalledWith('https://example.com')
  })

  it('new tab opens without an opener reference', () => {
    const win = fakeWindow()
    expect(openDestination('example.com', { newTab: true, win })).toBe('new-tab')
    expect(win.open).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener')
    expect(win.location.assign).not.toHaveBeenCalled()
  })

  it('never opens a forbidden scheme', () => {
    const win = fakeWindow()
    expect(openDestination('javascript:alert(1)', { win })).toBe('blocked')
    expect(win.open).not.toHaveBeenCalled()
    expect(win.location.assign).not.toHaveBeenCalled()
  })
})
