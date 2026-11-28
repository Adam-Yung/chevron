import { act, render, fireEvent } from '@testing-library/react'
import { SettingsContext } from '../../settings/SettingsProvider'
import Weather from './Weather'
import { setCachedCurrent, setCachedForecast } from './weatherCache'

const KEY = '0123456789abcdef0123456789abcdef'
const weather = { apiKey: KEY, lat: '1', lon: '2', units: 'imperial', forecastDays: 2 }
const settings = { weather, menu: { time: { fontSize: 1, format: 'h:m' } } }
const current = {
  name: 'Oslo', visibility: 9000, wind: { speed: 3.4, deg: 90 },
  main: { temp: 50.4, temp_max: 55, temp_min: 41, humidity: 60, feels_like: 48 },
  weather: [{ icon: '01d', description: 'clear sky' }]
}
const entry = (iso, temp) => ({ dt: Date.parse(iso) / 1000, main: { temp }, weather: [{ icon: '01d' }] })
const forecast = { list: [entry('2026-11-25T09:00:00', 40), entry('2026-11-26T09:00:00', 42), entry('2026-11-27T09:00:00', 44)] }
const place = '1,2,imperial'
const respond = async url => ({ ok: true, json: async () => (url.includes('/forecast') ? forecast : current) })

function mount(value = settings) {
  const root = document.createElement('div')
  root.id = 'root'
  document.body.appendChild(root)
  return render(<SettingsContext.Provider value={value}><Weather /></SettingsContext.Provider>, { container: root })
}

function openModal(view) {
  fireEvent.click(view.getByRole('button', { name: /weather details/ }))
  return view.getByRole('dialog')
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  document.getElementById('root')?.remove()
})

describe('Weather row', () => {
  beforeEach(() => {
    setCachedCurrent(current, place)
    setCachedForecast(forecast, place)
    vi.stubGlobal('fetch', vi.fn(respond))
  })

  it('shows the cached temperature with no request while the cache is fresh', () => {
    const view = mount()
    expect(view.getByRole('button', { name: '50°F, clear sky. Click for weather details.' }).title).toBe('clear sky — click for forecast')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('opens the dialog with stats and a capped forecast', () => {
    const view = mount()
    const dialog = openModal(view)
    expect(dialog.getAttribute('aria-label')).toBe('Weather in Oslo')
    expect(document.activeElement).toBe(dialog)
    expect(dialog.textContent.replace(/\s*\n\s*/g, '')).toBe(
      'Oslo50°Fclear sky↑ 55°F·↓ 41°F60%Humidity3 mph EWind9 kmVisibility48°FFeels like' +
      'WedNov 25↑ 40°F↓ 40°FThuNov 26↑ 42°F↓ 42°F')
  })

  it('closes by Escape, backdrop and button', () => {
    const view = mount()
    expect(fireEvent.keyDown(openModal(view), { key: 'Escape' })).toBe(false)
    expect(view.queryByRole('dialog')).toBeNull()
    const dialog = openModal(view)
    fireEvent.pointerDown(dialog)
    expect(view.queryByRole('dialog')).not.toBeNull()
    fireEvent.pointerDown(dialog.parentElement)
    expect(view.queryByRole('dialog')).toBeNull()
    openModal(view)
    fireEvent.click(view.getByRole('button', { name: 'Close weather' }))
    expect(view.queryByRole('dialog')).toBeNull()
  })

  it('renders the bare clock for a place with no data yet', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    const view = mount({ ...settings, weather: { ...weather, lat: '9' } })
    expect(view.queryByRole('button')).toBeNull()
  })
})

describe('Weather fetching', () => {
  it('fetches both sources, and again when the tab is shown with a stale cache', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn(respond))
    const view = mount()
    await act(async () => {})
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(view.getByRole('button', { name: /50°F/ })).toBeTruthy()
    act(() => { vi.advanceTimersByTime(61 * 60_000) })
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')) })
    expect(fetch).toHaveBeenCalledTimes(4)
    view.unmount()
    act(() => { vi.advanceTimersByTime(61 * 60_000) })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(fetch).toHaveBeenCalledTimes(4)
  })

  it('sends nothing without a well-formed key', () => {
    vi.stubGlobal('fetch', vi.fn())
    mount({ ...settings, weather: { ...weather, apiKey: 'nope' } })
    expect(fetch).not.toHaveBeenCalled()
  })
})
