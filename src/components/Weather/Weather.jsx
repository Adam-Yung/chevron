import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SettingsContext } from '../../contexts/Settings'
import useOnlineStatus from '../../hooks/useOnlineStatus'
import { fetchCurrentWeather, fetchForecast } from '../../functions/webUtils/openWeather'
import {
  getCachedCurrent, getCachedForecast,
  setCachedCurrent, setCachedForecast
} from './weatherCache'
import classes from './Weather.module.css'

// Phase 8d: Weather widget for the ChevronTop row.
// Shows current conditions inline; hovering/tapping reveals a forecast
// strip that slides down below the row.
//
// Data flow (stale-while-revalidate):
//   1. On mount, serve cached data immediately (no loading flash).
//   2. If cache is missing or stale, fetch in background.
//   3. On success, update state + cache.
//   4. Offline: keep showing cached data with a "stale" dot.
//
// This component is lazy-loaded from ChevronTop so it never appears in
// the initial paint bundle.

function Weather() {
  const settings   = useContext(SettingsContext)
  const isOnline   = useOnlineStatus()

  const apiKey     = settings.weather?.apiKey  ?? ''
  const lat        = settings.weather?.lat     ?? ''
  const lon        = settings.weather?.lon     ?? ''
  const units      = settings.weather?.units   ?? 'metric'
  const maxDays    = settings.weather?.forecastDays ?? 5

  const [current,  setCurrent]  = useState(() => getCachedCurrent())
  const [forecast, setForecast] = useState(() => getCachedForecast())
  const [showStrip, setShowStrip] = useState(false)
  const stripRef = useRef(null)

  // Background fetch — fires on mount and whenever key/coords change.
  const fetchAll = useCallback(async (abortSignal) => {
    if (!apiKey || !lat || !lon) return
    try {
      const [cur, fore] = await Promise.all([
        fetchCurrentWeather(lat, lon, units, apiKey, abortSignal),
        fetchForecast(lat, lon, units, apiKey, abortSignal)
      ])
      setCachedCurrent(cur)
      setCachedForecast(fore)
      setCurrent({ stale: false, data: cur })
      setForecast({ stale: false, data: fore })
    } catch {
      // Silently ignore — stale cache data (if any) stays in place.
    }
  }, [apiKey, lat, lon, units])

  useEffect(() => {
    const controller = new AbortController()
    // Always seed from cache first (handles the hot-reload case).
    setCurrent(getCachedCurrent())
    setForecast(getCachedForecast())
    if (isOnline) fetchAll(controller.signal)
    return () => controller.abort()
  }, [fetchAll, isOnline])

  // Close forecast strip on click-outside or Esc.
  useEffect(() => {
    if (!showStrip) return
    const onKey = (e) => { if (e.key === 'Escape') setShowStrip(false) }
    const onPointer = (e) => {
      if (stripRef.current && !stripRef.current.contains(e.target))
        setShowStrip(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [showStrip])

  if (!current?.data) return null

  const w       = current.data
  const temp    = Math.round(w.main?.temp ?? 0)
  const high    = Math.round(w.main?.temp_max ?? temp)
  const low     = Math.round(w.main?.temp_min ?? temp)
  const icon    = w.weather?.[0]?.icon
  const desc    = w.weather?.[0]?.description ?? ''
  const isStale = current.stale || !isOnline

  // Derive forecast days from the 3-hour list: take the first entry per
  // calendar day (UTC), up to maxDays.
  const forecastDays = (() => {
    if (!forecast?.data?.list || maxDays === 0) return []
    const seen = new Set()
    const days = []
    for (const entry of forecast.data.list) {
      const day = new Date(entry.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })
      if (seen.has(day)) continue
      seen.add(day)
      days.push({ day, temp: Math.round(entry.main.temp), icon: entry.weather?.[0]?.icon })
      if (days.length >= maxDays) break
    }
    return days
  })()

  const unitSymbol = units === 'imperial' ? '°F' : units === 'standard' ? 'K' : '°C'

  return (
    <div className={classes['root']} ref={stripRef}>
      <button
        type="button"
        className={classes['current']}
        title={desc}
        onClick={() => forecastDays.length > 0 && setShowStrip(s => !s)}
        aria-expanded={showStrip}
        aria-label={`Weather: ${temp}${unitSymbol}, ${desc}`}>
        {icon && (
          <img
            className={classes['icon']}
            src={`https://openweathermap.org/img/wn/${icon}.png`}
            alt={desc}
            width={24}
            height={24}
          />
        )}
        <span className={classes['temp']}>{temp}{unitSymbol}</span>
        <span className={classes['hilo']}>
          ↑{high} ↓{low}
        </span>
        {isStale && <span className={classes['stale']} title="Cached data" aria-label="Cached data">·</span>}
      </button>

      <AnimatePresence>
        {showStrip && forecastDays.length > 0 && (
          <motion.div
            className={classes['strip']}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}>
            {forecastDays.map(({ day, temp: t, icon: ic }) => (
              <div key={day} className={classes['strip-day']}>
                {ic && (
                  <img
                    className={classes['strip-icon']}
                    src={`https://openweathermap.org/img/wn/${ic}.png`}
                    alt=""
                    width={20}
                    height={20}
                  />
                )}
                <span className={classes['strip-label']}>{day}</span>
                <span className={classes['strip-temp']}>{t}{unitSymbol}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Weather
