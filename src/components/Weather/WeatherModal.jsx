import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import classes from './WeatherModal.module.css'

// Temperature colour scale — used for both the inline thermometer icons
// and the forecast card accent colours.
function tempColor(temp, units) {
  // Normalise to Celsius for the scale regardless of display units.
  const c = units === '°F' ? (temp - 32) / 1.8 : units === 'K' ? temp - 273.15 : temp
  if (c <= 0)  return '#60a5fa' // freezing — sky blue
  if (c <= 10) return '#93c5fd' // cold — light blue
  if (c <= 18) return '#6ee7b7' // cool — mint
  if (c <= 24) return '#fbbf24' // warm — amber
  if (c <= 30) return '#f97316' // hot — orange
  return '#ef4444'              // scorching — red
}

// Map OWM icon code prefix to a weather emoji for colour-safe display.
function weatherEmoji(icon) {
  if (!icon) return '🌡'
  const code = icon.replace('d', '').replace('n', '')
  const map = {
    '01': '☀️', '02': '⛅', '03': '☁️', '04': '☁️',
    '09': '🌧', '10': '🌦', '11': '⛈', '13': '❄️', '50': '🌫'
  }
  return map[code] ?? '🌡'
}

// Derive per-day high/low/icon from the OWM 3-hour forecast list.
function buildForecastDays(list, maxDays) {
  if (!list?.length) return []
  const byDay = new Map()
  for (const entry of list) {
    const date = new Date(entry.dt * 1000)
    const key  = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    if (!byDay.has(key)) byDay.set(key, { key, temps: [], icons: [] })
    const d = byDay.get(key)
    d.temps.push(entry.main.temp)
    if (entry.weather?.[0]?.icon) d.icons.push(entry.weather[0].icon)
  }
  return [...byDay.values()].slice(0, maxDays).map(d => ({
    label: d.key,
    high:  Math.round(Math.max(...d.temps)),
    low:   Math.round(Math.min(...d.temps)),
    icon:  d.icons[Math.floor(d.icons.length / 2)] ?? d.icons[0]
  }))
}

export default function WeatherModal({ current, forecast, units, maxDays, isStale, onClose }) {
  const dialogRef = useRef(null)

  // Focus trap + Esc close
  useEffect(() => {
    const prev = document.activeElement
    const id = requestAnimationFrame(() => dialogRef.current?.focus())
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose() } }
    document.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(id)
      document.removeEventListener('keydown', onKey)
      try { prev?.focus() } catch {}
    }
  }, [onClose])

  const handleBackdrop = useCallback((e) => {
    if (e.target === e.currentTarget) onClose()
  }, [onClose])

  const w          = current
  const temp       = Math.round(w.main?.temp ?? 0)
  const feelsLike  = Math.round(w.main?.feels_like ?? temp)
  const high       = Math.round(w.main?.temp_max ?? temp)
  const low        = Math.round(w.main?.temp_min ?? temp)
  const humidity   = w.main?.humidity ?? 0
  const windSpeed  = Math.round(w.wind?.speed ?? 0)
  const windDir    = w.wind?.deg ?? 0
  const visibility = w.visibility ? `${Math.round(w.visibility / 1000)} km` : null
  const desc       = w.weather?.[0]?.description ?? ''
  const icon       = w.weather?.[0]?.icon
  const cityName   = w.name ?? ''

  const highColor = tempColor(high, units)
  const lowColor  = tempColor(low,  units)
  const mainColor = tempColor(temp, units)

  const days = buildForecastDays(forecast?.list, maxDays)

  // Cardinal direction from degrees
  const windCardinal = (() => {
    const dirs = ['N','NE','E','SE','S','SW','W','NW']
    return dirs[Math.round(windDir / 45) % 8]
  })()

  return createPortal(
    <AnimatePresence>
      <motion.div
        className={classes['backdrop']}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onPointerDown={handleBackdrop}
        data-keep-focus="true">

        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Weather in ${cityName}`}
          tabIndex={-1}
          className={classes['modal']}
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}>

          {/* ── Header ── */}
          <div className={classes['header']}>
            <div>
              <div className={classes['city']}>{cityName}</div>
              {isStale && <div className={classes['stale-badge']}>Cached data</div>}
            </div>
            <button
              type="button"
              className={classes['close']}
              onClick={onClose}
              aria-label="Close weather">
              ✕
            </button>
          </div>

          {/* ── Hero current conditions ── */}
          <div className={classes['hero']}>
            <div className={classes['hero-left']}>
              <div className={classes['hero-emoji']}>{weatherEmoji(icon)}</div>
              <div className={classes['hero-temp']} style={{ color: mainColor }}>
                {temp}{units}
              </div>
              <div className={classes['hero-desc']}>{desc}</div>
              <div className={classes['hero-feels']}>Feels like {feelsLike}{units}</div>
            </div>

            <div className={classes['hero-right']}>
              {/* Hi/Lo with colored thermometers */}
              <div className={classes['hilo']}>
                <span className={classes['hilo-item']}>
                  <span className={classes['thermo']} style={{ color: highColor }}>🌡</span>
                  <span className={classes['hilo-label']}>High</span>
                  <span className={classes['hilo-val']} style={{ color: highColor }}>{high}{units}</span>
                </span>
                <span className={classes['hilo-item']}>
                  <span className={classes['thermo']} style={{ color: lowColor }}>🌡</span>
                  <span className={classes['hilo-label']}>Low</span>
                  <span className={classes['hilo-val']} style={{ color: lowColor }}>{low}{units}</span>
                </span>
              </div>

              {/* Detail stats */}
              <div className={classes['stats']}>
                <div className={classes['stat']}>
                  <span className={classes['stat-icon']}>💧</span>
                  <span className={classes['stat-val']}>{humidity}%</span>
                  <span className={classes['stat-label']}>Humidity</span>
                </div>
                <div className={classes['stat']}>
                  <span className={classes['stat-icon']}>🌬</span>
                  <span className={classes['stat-val']}>{windSpeed} m/s {windCardinal}</span>
                  <span className={classes['stat-label']}>Wind</span>
                </div>
                {visibility && (
                  <div className={classes['stat']}>
                    <span className={classes['stat-icon']}>👁</span>
                    <span className={classes['stat-val']}>{visibility}</span>
                    <span className={classes['stat-label']}>Visibility</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Forecast strip ── */}
          {days.length > 0 && (
            <div className={classes['forecast']}>
              {days.map(({ label, high: h, low: l, icon: ic }) => {
                const hc = tempColor(h, units)
                const lc = tempColor(l, units)
                return (
                  <div key={label} className={classes['day-card']}>
                    <div className={classes['day-label']}>{label.split(',')[0]}</div>
                    <div className={classes['day-date']}>{label.split(',').slice(1).join(',').trim()}</div>
                    <div className={classes['day-emoji']}>{weatherEmoji(ic)}</div>
                    <div className={classes['day-high']} style={{ color: hc }}>
                      <span style={{ fontSize: '0.8em' }}>🌡</span> {h}{units}
                    </div>
                    <div className={classes['day-low']} style={{ color: lc }}>
                      <span style={{ fontSize: '0.8em' }}>🌡</span> {l}{units}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.getElementById('root')
  )
}
