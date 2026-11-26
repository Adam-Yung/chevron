import { describe, expect, it } from 'vitest'
import { buildForecastDays, tempColor, toCardinal } from './forecast'

describe('tempColor', () => {
  it('bands Celsius values from cold to hot', () => {
    expect(tempColor(-5, '°C')).toBe('#60a5fa')
    expect(tempColor(20, '°C')).toBe('#fbbf24')
    expect(tempColor(40, '°C')).toBe('#ef4444')
  })

  it('converts Fahrenheit and Kelvin before banding', () => {
    expect(tempColor(32, '°F')).toBe('#60a5fa')
    expect(tempColor(273.15, 'K')).toBe('#60a5fa')
  })
})

describe('toCardinal', () => {
  it('wraps 360 degrees back to north', () => {
    expect(toCardinal(0)).toBe('N')
    expect(toCardinal(90)).toBe('E')
    expect(toCardinal(360)).toBe('N')
  })
})

describe('buildForecastDays', () => {
  const at = (iso, temp, icon) => ({ dt: Date.parse(iso) / 1000, main: { temp }, weather: [{ icon }] })

  it('groups 3-hour entries per day with rounded high and low', () => {
    const list = [at('2026-11-25T09:00:00', 4.4, '01d'), at('2026-11-25T15:00:00', 9.6, '02d'), at('2026-11-26T09:00:00', 1, '13d')]
    const days = buildForecastDays(list, 5)
    expect(days).toHaveLength(2)
    expect(days[0]).toMatchObject({ high: 10, low: 4 })
  })

  it('respects maxDays, including 0', () => {
    const list = [at('2026-11-25T09:00:00', 4, '01d'), at('2026-11-26T09:00:00', 1, '13d')]
    expect(buildForecastDays(list, 1)).toHaveLength(1)
    expect(buildForecastDays(list, 0)).toHaveLength(0)
  })

  it('returns nothing for a missing list', () => {
    expect(buildForecastDays(undefined, 5)).toEqual([])
  })
})
