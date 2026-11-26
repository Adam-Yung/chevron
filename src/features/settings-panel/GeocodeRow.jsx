import { useCallback, useEffect, useRef, useState } from 'react'
import { geocodeCity } from '../weather/openWeather'
import { clearWeatherCache } from '../weather/weatherCache'
import classes from './GeocodeRow.module.css'

const API_KEY_SHAPE = /^[0-9a-f]{32}$/i

function setWeather(onChange, patch) {
  onChange(prev => ({ ...prev, weather: { ...prev.weather, ...patch } }))
}

// Resolve state machine: one request at a time, an older one is aborted so a slow reply cannot overwrite a newer pick, and the
// request is aborted when the panel closes.
function useResolve(apiKey, city) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  const resolve = useCallback(async () => {
    if (!apiKey || !city) return
    if (!API_KEY_SHAPE.test(apiKey)) {
      setError('API key must be a 32-character hex string from openweathermap.org.')
      return
    }
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)
    setResults([])
    try {
      const data = await geocodeCity(city, apiKey, controller.signal)
      if (controller.signal.aborted) return
      if (data.length) setResults(data)
      else setError('No locations found.')
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message || 'Geocoding failed.')
    } finally {
      if (abortRef.current === controller) setLoading(false)
    }
  }, [apiKey, city])

  return { results, setResults, loading, error, resolve }
}

// City input plus Resolve: picking a result writes city, lat and lon together and drops the cached forecast for the old place.
export default function GeocodeRow({ current, onChange }) {
  const apiKey = current.weather?.apiKey ?? ''
  const city = current.weather?.city ?? ''
  const { results, setResults, loading, error, resolve } = useResolve(apiKey, city)

  const select = result => {
    setWeather(onChange, { city: result.name, lat: String(result.lat), lon: String(result.lon) })
    clearWeatherCache()
    setResults([])
  }

  const { lat, lon } = current.weather ?? {}

  return (
    <div className={classes['row']}>
      <div className={classes['inputs']}>
        <div className={classes['cityField']}>
          <label className={classes['label']} htmlFor="settings-weather-city">City</label>
          <input
            id="settings-weather-city"
            type="text"
            className={classes['city']}
            value={city}
            placeholder="e.g. London, Tokyo"
            onChange={e => setWeather(onChange, { city: e.target.value })}
          />
        </div>
        <button type="button" className={classes['resolve']} onClick={resolve} disabled={!apiKey || !city || loading}>
          {loading ? '…' : 'Resolve'}
        </button>
      </div>
      {error && <p className={classes['error']}>{error}</p>}
      {results.length > 0 && (
        <ul className={classes['results']}>
          {results.map(r => (
            <li key={`${r.lat},${r.lon}`}>
              <button type="button" className={classes['result']} onClick={() => select(r)}>
                {r.name}{r.state ? `, ${r.state}` : ''}, {r.country}
                <span className={classes['coords']}>{Number(r.lat).toFixed(4)}, {Number(r.lon).toFixed(4)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {lat && lon && <p className={classes['note']}>Coordinates set: {lat}, {lon}</p>}
    </div>
  )
}
