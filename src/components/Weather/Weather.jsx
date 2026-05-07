import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { SettingsContext } from '../../contexts/Settings'
import useOnlineStatus from '../../hooks/useOnlineStatus'
import { fetchCurrentWeather, fetchForecast } from '../../functions/webUtils/openWeather'
import {
  getCachedCurrent, getCachedForecast,
  setCachedCurrent, setCachedForecast
} from './weatherCache'
import WeatherModal from './WeatherModal'
import Time from '../Time/Time'
import classes from './Weather.module.css'

// OWM free-tier keys are exactly 32 hex chars.
const OWM_KEY_MIN_LEN = 32

// Map OWM icon code prefix → weather emoji (no pixelated PNGs anywhere).
export function weatherEmoji(icon) {
  if (!icon) return '🌤'
  const code = icon.slice(0, 2)
  const isNight = icon.endsWith('n')
  const map = {
    '01': isNight ? '🌙' : '☀️',
    '02': isNight ? '🌙' : '⛅',
    '03': '🌥', '04': '☁️',
    '09': '🌧', '10': '🌦',
    '11': '⛈', '13': '❄️', '50': '🌫'
  }
  return map[code] ?? '🌤'
}

// Phase 8d_cont: this component renders the ENTIRE ChevronTop row:
//   [TIME]  ·  [temp] [emoji]
// as a single clickable button that opens the weather modal.
// Lazy-loaded from ChevronTop so it never touches the first-paint bundle.
// If weather data hasn't loaded yet, falls back to rendering just <Time/>.
function Weather() {
  const settings  = useContext(SettingsContext)
  const isOnline  = useOnlineStatus()

  const apiKey  = settings.weather?.apiKey  ?? ''
  const lat     = settings.weather?.lat     ?? ''
  const lon     = settings.weather?.lon     ?? ''
  const units   = settings.weather?.units   ?? 'metric'
  const maxDays = settings.weather?.forecastDays ?? 5

  const [current,   setCurrent]   = useState(() => getCachedCurrent())
  const [forecast,  setForecast]  = useState(() => getCachedForecast())
  const [showModal, setShowModal] = useState(false)

  // Stable ref keeps latest params without recreating the fetch callback.
  const paramsRef = useRef({ apiKey, lat, lon, units })
  useEffect(() => { paramsRef.current = { apiKey, lat, lon, units } }, [apiKey, lat, lon, units])

  // Monotonically-increasing counter. Each effect run claims a generation;
  // the async callback checks it before writing state so a superseded fetch
  // (triggered by rapid lat/lon edits) never overwrites fresher data.
  const fetchGenRef = useRef(0)

  const doFetch = useCallback(async (signal, generation) => {
    const { apiKey: key, lat: la, lon: lo, units: u } = paramsRef.current
    if (!key || key.length < OWM_KEY_MIN_LEN || !la || !lo) return
    try {
      const [cur, fore] = await Promise.all([
        fetchCurrentWeather(la, lo, u, key, signal),
        fetchForecast(la, lo, u, key, signal)
      ])
      // Discard if a newer fetch has already started.
      if (generation !== fetchGenRef.current) return
      setCachedCurrent(cur)
      setCachedForecast(fore)
      setCurrent({ stale: false, data: cur })
      setForecast({ stale: false, data: fore })
    } catch { /* stale cache stays visible */ }
  }, [])

  // Re-fetch only when coordinates actually change, not on every keystroke.
  useEffect(() => {
    const controller = new AbortController()
    const generation = ++fetchGenRef.current
    setCurrent(getCachedCurrent())
    setForecast(getCachedForecast())
    if (isOnline && lat && lon) doFetch(controller.signal, generation)
    return () => controller.abort()
  }, [lat, lon, isOnline, doFetch])

  // No weather data yet — render just the clock so the row is never empty.
  if (!current?.data) {
    return <div className={classes['row-plain']}><Time /></div>
  }

  const w          = current.data
  const temp       = Math.round(w.main?.temp ?? 0)
  const icon       = w.weather?.[0]?.icon
  const desc       = w.weather?.[0]?.description ?? ''
  const isStale    = current.stale || !isOnline
  const unitSymbol = units === 'imperial' ? '°F' : units === 'standard' ? 'K' : '°C'

  return (
    <>
      <button
        type="button"
        className={classes['row']}
        onClick={() => setShowModal(true)}
        title={`${desc} — click for forecast`}
        aria-label={`${temp}${unitSymbol}, ${desc}. Click for weather details.`}>
        <Time />
        <span className={classes['sep']}>·</span>
        <span className={classes['temp']}>{temp}{unitSymbol}</span>
        <span className={classes['emoji']}>{weatherEmoji(icon)}</span>
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
