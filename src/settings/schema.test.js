import { describe, it, expect } from 'vitest'
import settings from './schema'

describe('schema', () => {
  it('shows the redirect target and describes it as a new-tab switch', () => {
    expect(settings.hidden).not.toContain('general.redirectTarget')
    const entry = settings.template.general.redirectTarget
    expect(entry.label).toBe('Open results in a new tab')
    expect(entry.positions).toEqual(['_self', '_blank'])
    expect(settings.defaults.general.redirectTarget).toBe('_self')
  })

  it('has a dock switch that defaults on', () => {
    expect(settings.defaults.appearance.dock).toBe(true)
    expect(settings.template.appearance.dock.description).toBe('Show your pinned sites along the bottom of the start screen.')
  })

  it('defaults animation speed to 250ms', () => {
    expect(settings.defaults.general.animationSpeed).toBe(250)
    expect(settings.template.general.animationSpeed.description).toBe('Speed of transitions. Lower is snappier; 0 turns animation off.')
  })

  it('keeps advanced theme colours hidden', () => {
    expect(settings.hidden).toContain('appearance.themes.default.light.background')
  })
})
