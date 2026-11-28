import { describe, expect, it } from 'vitest'
import { SHORTCUT_SECTIONS } from './shortcuts'

describe('SHORTCUT_SECTIONS', () => {
  it('covers search, the sites menu and global keys', () => {
    expect(SHORTCUT_SECTIONS.map(s => s.title)).toEqual(['Search', 'Sites menu', 'Anywhere'])
  })

  it('says a card letter needs Shift: a plain letter filters', () => {
    const row = SHORTCUT_SECTIONS.flatMap(s => s.rows).find(r => r.label === 'Open the card showing that letter')
    expect(row.keys).toEqual([['Shift', '<letter>']])
  })

  it('gives every row at least one combo and a label', () => {
    for (const row of SHORTCUT_SECTIONS.flatMap(s => s.rows)) {
      expect(row.label).toBeTruthy()
      expect(row.keys.length).toBeGreaterThan(0)
      row.keys.forEach(combo => expect(combo.length).toBeGreaterThan(0))
    }
  })
})
