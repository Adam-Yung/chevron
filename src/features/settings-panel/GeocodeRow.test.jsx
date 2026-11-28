import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { useState } from 'react'
import GeocodeRow from './GeocodeRow'
import { geocodeCity } from '../weather/openWeather'
import { clearWeatherCache } from '../weather/weatherCache'

vi.mock('../weather/openWeather', () => ({ geocodeCity: vi.fn() }))
vi.mock('../weather/weatherCache', () => ({ clearWeatherCache: vi.fn() }))

const KEY = '0123456789abcdef0123456789abcdef'
let latest

function Host({ weather }) {
  const [current, setCurrent] = useState({ other: 1, weather })
  latest = current
  return <GeocodeRow current={current} onChange={setCurrent} />
}

const resolveButton = () => screen.getByRole('button', { name: /Resolve|…/ })
const resolve = () => act(async () => { fireEvent.click(resolveButton()) })

beforeEach(() => { geocodeCity.mockReset() })

describe('GeocodeRow', () => {
  it('needs both a key and a city', () => {
    render(<Host />)
    expect(resolveButton().disabled).toBe(true)
    expect(screen.getByLabelText('City').value).toBe('')
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Oslo' } })
    expect(latest.weather).toEqual({ city: 'Oslo' })
    expect(latest.other).toBe(1)
    expect(screen.queryByText(/Coordinates set/)).toBeNull()
  })

  it('rejects a malformed key before any request', async () => {
    render(<Host weather={{ apiKey: 'short', city: 'Oslo' }} />)
    await resolve()
    expect(screen.getByText('API key must be a 32-character hex string from openweathermap.org.')).toBeTruthy()
    expect(geocodeCity).not.toHaveBeenCalled()
  })

  it('lists matches and writes the picked one', async () => {
    geocodeCity.mockResolvedValue([{ name: 'Oslo', lat: 59.9, lon: 10.7, country: 'NO' }, { name: 'Oslo', lat: 48.2, lon: -97.1, country: 'US', state: 'Minnesota' }])
    render(<Host weather={{ apiKey: KEY, city: 'osl' }} />)
    await resolve()
    expect(geocodeCity).toHaveBeenCalledWith('osl', KEY, expect.any(AbortSignal))
    const options = screen.getAllByRole('listitem').map(li => li.textContent)
    expect(options).toEqual(['Oslo, NO59.9000, 10.7000', 'Oslo, Minnesota, US48.2000, -97.1000'])
    fireEvent.click(screen.getByRole('button', { name: /Minnesota/ }))
    expect(latest.weather).toEqual({ apiKey: KEY, city: 'Oslo', lat: '48.2', lon: '-97.1' })
    expect(clearWeatherCache).toHaveBeenCalled()
    expect(screen.queryByRole('list')).toBeNull()
    expect(screen.getByText(/Coordinates set/).textContent).toBe('Coordinates set: 48.2, -97.1')
  })

  it('reports no matches and failures', async () => {
    geocodeCity.mockResolvedValueOnce([])
    render(<Host weather={{ apiKey: KEY, city: 'x' }} />)
    await resolve()
    expect(screen.getByText('No locations found.')).toBeTruthy()
    geocodeCity.mockRejectedValueOnce(new Error('Geocode failed: 401'))
    await resolve()
    expect(screen.getByText('Geocode failed: 401')).toBeTruthy()
    expect(resolveButton().textContent).toBe('Resolve')
  })

  it('shows it is busy and aborts when the panel closes', async () => {
    geocodeCity.mockReturnValue(new Promise(() => {}))
    const view = render(<Host weather={{ apiKey: KEY, city: 'x' }} />)
    await resolve()
    expect(resolveButton().textContent).toBe('…')
    expect(resolveButton().disabled).toBe(true)
    view.unmount()
    expect(geocodeCity.mock.calls[0][2].aborted).toBe(true)
  })
})
