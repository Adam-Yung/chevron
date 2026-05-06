import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { SettingsContext } from '../../contexts/Settings'
import useOnlineStatus from '../../hooks/useOnlineStatus'
import { fetchCurrentWeather, fetchForecast } from '../../functions/webUtils/openWeather'
import {
  getCachedCurrent, getCachedForecast,
  setCachedCurrent, setCachedForecast
} from './weatherCache'
import WeatherModal from './WeatherModal'
import classes from './Weather.module.css'

// OWM free-tier keys are exactly 32 hex chars. Require minimum length so
// we don't fire network requests on every keystroke while the user types
// their key into the settings field.
const OWM_KEY_MIN_LEN = 32

function Weather() {
  const settings = useContext(SettingsContext)
  const isOnline = useOnlineStatus()

  const apiKey  = settings.weather?.apiKey  ?? ''
  const lat     = settings.weather?.lat     ?? ''
  const lon     = settings.weather?.lon     ?? ''
  const units   = settings.weather?.units   ?? 'metric'
  const maxDays = settings.weather?.forecastDays ?? 5

  const [current,  setCurrent]  = useState(() => getCachedCurrent())
  const [forecast, setForecast] = useState(() => getCachedForecast())
  const [showModal, setShowModal] = useState(false)

  // Keep a ref to the latest fetch params so the effect callback never
  // closes over stale values — but the effect itself only re-runs when
  // lat/lon settle (not on every apiKey keystroke).
  const paramsRef = useRef({ apiKey, lat, lon, units })
  useEffect(() => { paramsRef.current = { apiKey, lat, lon, units } }, [apiKey, lat, lon, units])

  // Stable fetch function — reads from ref so it never changes identity.
  const doFetch = useCallback(async (signal) => {
    const { apiKey: key, lat: la, lon: lo, units: u } = paramsRef.current
    if (!key || key.length < OWM_KEY_MIN_LEN || !la || !lo) return
    try {
      const [cur, fore] = await Promise.all([
        fetchCurrentWeather(la, lo, u, key, signal),
        fetchForecast(la, lo, u, key, signal)
      ])
      setCachedCurrent(cur)
      setCachedForecast(fore)
      setCurrent({ stale: false, data: cur })
      setForecast({ stale: false, data: fore })
    } catch {
      // Network error or abort — stale cache data stays visible.
    }
  }, []) // intentionally stable — reads paramsRef

  // Only re-fetch when lat/lon actually resolve to new values. This fires
  // once when the component mounts and again only when coordinates change
  // (e.g., the user resolves a new city), NOT on every apiKey keystroke.
  useEffect(() => {
    const controller = new AbortController()
    setCurrent(getCachedCurrent())
    setForecast(getCachedForecast())
    if (isOnline && lat && lon) doFetch(controller.signal)
    return () => controller.abort()
  }, [lat, lon, isOnline, doFetch])

  if (!current?.data) return null

  const w       = current.data
  const temp    = Math.round(w.main?.temp ?? 0)
  const icon    = w.weather?.[0]?.icon
  const desc    = w.weather?.[0]?.description ?? ''
  const isStale = current.stale || !isOnline
  const unitSymbol = units === 'imperial' ? '°F' : units === 'standard' ? 'K' : '°C'

  return (
    <>
      <button
        type="button"
        className={classes['chip']}
        onClick={() => setShowModal(true)}
        title={`${desc} — click for forecast`}
        aria-label={`Weather: ${temp}${unitSymbol}, ${desc}. Click for details.`}>
        {icon && (
          <img
            className={classes['chip-icon']}
            src={`https://openweathermap.org/img/wn/${icon}.png`}
            alt=""
            width={28}
            height={28}
          />
        )}
        <span className={classes['chip-temp']}>{temp}{unitSymbol}</span>
        {isStale && <span className={classes['stale-dot']} aria-hidden="true" />}
      </button>

      {showModal && (
        <WeatherModal
          current={current.data}
          forecast={forecast?.data}
          units={unitSymbol}
          maxDays={maxDays}
          isStale={isStale}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}

export default Weather
