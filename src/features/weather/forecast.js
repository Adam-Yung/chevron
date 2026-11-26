// Pure helpers that turn OpenWeatherMap payloads into display values.

const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
const COLD_TO_HOT = [
  [0, '#60a5fa'], [10, '#93c5fd'], [18, '#6ee7b7'], [24, '#fbbf24'], [30, '#f97316']
]

export const toCardinal = deg => CARDINALS[Math.round(deg / 45) % 8]

// The colour scale is defined in Celsius, so Fahrenheit and Kelvin are converted first.
export function tempColor(temp, units) {
  const celsius = units === '°F' ? (temp - 32) / 1.8 : units === 'K' ? temp - 273.15 : temp
  const band = COLD_TO_HOT.find(([max]) => celsius <= max)
  return band ? band[1] : '#ef4444'
}

// Today is included with whatever hours remain, so the strip always shows the full window OWM provides.
export function buildForecastDays(list, maxDays) {
  if (!list?.length) return []
  const byDay = new Map()
  for (const entry of list) {
    const key = new Date(entry.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    if (!byDay.has(key)) byDay.set(key, { key, temps: [], icons: [] })
    const day = byDay.get(key)
    day.temps.push(entry.main.temp)
    if (entry.weather?.[0]?.icon) day.icons.push(entry.weather[0].icon)
  }
  return [...byDay.values()].slice(0, maxDays).map(day => ({
    label: day.key,
    high: Math.round(Math.max(...day.temps)),
    low: Math.round(Math.min(...day.temps)),
    icon: day.icons[Math.floor(day.icons.length / 2)] ?? day.icons[0]
  }))
}
