import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, it, expect } from 'vitest'

// The files the page loads as plain scripts, read the same way: they only assign to `window`.
const window = {}
for (const file of ['public/config.js', 'public/icons.js']) runInNewContext(readFileSync(file, 'utf8'), { window })
const { macros } = window.CONFIG

const repeats = values => values.filter((value, i) => values.indexOf(value) !== i)

describe('the bundled sites', () => {
  it.each(['fmhy.net', 'calendar.google.com', 'docs.google.com', 'outlook.live.com', 'mail.proton.me'])('pins %s', domain => {
    expect(macros.find(m => m.normalisedURL === domain)).toMatchObject({ pinned: true })
  })

  it('never give two sites the same trigger or hotkey: the second would be unreachable', () => {
    expect(repeats(macros.flatMap(m => m.triggers))).toEqual([])
    expect(repeats(macros.map(m => m.key).filter(Boolean))).toEqual([])
  })

  it('give every pinned site an icon that exists', () => {
    expect(macros.filter(m => m.pinned && !window.ICONS[m.icon]).map(m => m.name)).toEqual([])
  })
})
