import { migrateSettings } from './settingsMigration'

const fullOldStore = () => ({
  chevron: { thickness: 15 },
  appearance: { themes: { default: {
    light: { primary: '#212121', chevron: '#212121', background: '#dee1e6' },
    dark: { primary: '#f2f2f2', chevron: '#ff0000', secondary: '#212121' }
  } } }
})

describe('migrating a full store from before the Sleeve Patch look', () => {
  it('drops old default values and keeps chosen ones', () => {
    const stored = migrateSettings(fullOldStore(), 3)
    expect(stored.chevron).toEqual({})
    expect(stored.appearance.themes.default.light).toEqual({})
    expect(stored.appearance.themes.default.dark).toEqual({ chevron: '#ff0000' })
  })

  it('leaves a current store alone', () => {
    expect(migrateSettings(fullOldStore(), 4)).toEqual(fullOldStore())
  })
})
