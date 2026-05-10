import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiDroplet, FiWind, FiEye, FiThermometer, FiX } from 'react-icons/fi'
import { WeatherIcon, iconToScene } from './WeatherIcon'
import classes from './WeatherModal.module.css'

// Temperature colour scale.
function tempColor(temp, units) {
  const c = units === '°F' ? (temp - 32) / 1.8 : units === 'K' ? temp - 273.15 : temp
  if (c <= 0)  return '#60a5fa'
  if (c <= 10) return '#93c5fd'
  if (c <= 18) return '#6ee7b7'
  if (c <= 24) return '#fbbf24'
  if (c <= 30) return '#f97316'
  return '#ef4444'
}

// Derive per-day high/low/icon from the OWM 3-hour forecast list.
// Includes today (partial data from remaining hours) so the user sees
// the full forecast window.  OWM free-tier provides up to 5 days.
function buildForecastDays(list, maxDays) {
  if (!list?.length) return []
  const byDay = new Map()
  for (const entry of list) {
    const key = new Date(entry.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
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

// Cardinal direction from degrees
function toCardinal(deg) {
  const dirs = ['N','NE','E','SE','S','SW','W','NW']
  return dirs[Math.round(deg / 45) % 8]
}

/**
 * AnimatedScene — pure CSS animated background inside the hero panel.
 * Keeps all keyframes local so they don't pollute global styles.
 */
function AnimatedScene({ scene }) {
  return (
    <div className={`${classes['scene']} ${classes[`scene--${scene}`]}`} aria-hidden="true">

      {/* ── Sunny ── */}
      {scene === 'sunny' && <>
        <div className={classes['sun-disc']} />
        <div className={classes['sun-halo']} />
        {[0,45,90,135,180,225,270,315].map(deg => (
          <div key={deg} className={classes['sun-ray']} style={{ '--deg': `${deg}deg` }} />
        ))}
        <div className={classes['sc-cloud']} style={{ '--dx':'-8%', '--dur':'22s', '--op':'0.18', '--scale':'1' }} />
        <div className={classes['sc-cloud']} style={{ '--dx':'-5%', '--dur':'30s', '--op':'0.12', '--scale':'0.6' }} />
      </>}

      {/* ── Night ── */}
      {scene === 'night' && <>
        <div className={classes['moon']} />
        {[[15,18],[80,12],[60,55],[25,70],[88,65],[50,30],[10,42]].map(([x,y],i) => (
          <div key={i} className={classes['star']}
            style={{ '--x':`${x}%`, '--y':`${y}%`, '--delay':`${(i*0.7).toFixed(1)}s` }} />
        ))}
      </>}

      {/* ── Partly cloudy ── */}
      {scene === 'partly-cloudy' && <>
        <div className={classes['sun-disc']} style={{ opacity: 0.6 }} />
        <div className={classes['sc-cloud']} style={{ '--dx':'-12%', '--dur':'25s', '--op':'0.85', '--scale':'1' }} />
        <div className={classes['sc-cloud']} style={{ '--dx':'-8%',  '--dur':'35s', '--op':'0.6',  '--scale':'0.7', top: '45%', left: '55%' }} />
      </>}

      {/* ── Cloudy ── */}
      {scene === 'cloudy' && <>
        <div className={classes['sc-cloud']} style={{ '--dx':'-10%', '--dur':'20s', '--op':'0.9', '--scale':'1.1' }} />
        <div className={classes['sc-cloud']} style={{ '--dx':'-6%', '--dur':'28s', '--op':'0.7', '--scale':'0.75', top:'40%', left:'60%' }} />
        <div className={classes['sc-cloud']} style={{ '--dx':'-8%', '--dur':'35s', '--op':'0.5', '--scale':'0.5', top:'60%', left:'20%' }} />
      </>}

      {/* ── Rain ── */}
      {scene === 'rain' && <>
        <div className={classes['sc-cloud']} style={{ '--dx':'-5%', '--dur':'22s', '--op':'0.85', '--scale':'1.1' }} />
        {Array.from({ length: 22 }, (_, i) => (
          <div key={i} className={classes['raindrop']}
            style={{
              '--x': `${(i * 4.5 + Math.sin(i) * 6).toFixed(1)}%`,
              '--delay': `${(i * 0.13 % 1.4).toFixed(2)}s`,
              '--dur': `${(0.7 + (i % 4) * 0.1).toFixed(1)}s`,
              '--len': `${14 + (i % 5) * 3}px`,
            }}
          />
        ))}
      </>}

      {/* ── Heavy rain ── */}
      {scene === 'heavy-rain' && <>
        <div className={classes['sc-cloud']} style={{ '--dx':'-4%', '--dur':'18s', '--op':'0.95', '--scale':'1.15' }} />
        {Array.from({ length: 38 }, (_, i) => (
          <div key={i} className={classes['raindrop']}
            style={{
              '--x': `${(i * 2.65 + Math.cos(i) * 3).toFixed(1)}%`,
              '--delay': `${(i * 0.08 % 1.0).toFixed(2)}s`,
              '--dur': `${(0.5 + (i % 4) * 0.08).toFixed(2)}s`,
              '--len': `${18 + (i % 6) * 3}px`,
            }}
          />
        ))}
      </>}

      {/* ── Storm ── */}
      {scene === 'storm' && <>
        <div className={classes['sc-cloud']} style={{ '--dx':'-3%', '--dur':'15s', '--op':'1', '--scale':'1.2' }} />
        {Array.from({ length: 28 }, (_, i) => (
          <div key={i} className={classes['raindrop']}
            style={{
              '--x': `${(i * 3.6 + Math.sin(i * 1.3) * 5).toFixed(1)}%`,
              '--delay': `${(i * 0.09 % 1.1).toFixed(2)}s`,
              '--dur': `${(0.55 + (i % 3) * 0.09).toFixed(2)}s`,
              '--len': `${20 + (i % 5) * 4}px`,
            }}
          />
        ))}
        <div className={classes['lightning']} style={{ '--delay': '0s' }} />
        <div className={classes['lightning']} style={{ '--delay': '2.1s' }} />
        <div className={classes['lightning']} style={{ '--delay': '4.4s' }} />
      </>}

      {/* ── Snow ── */}
      {scene === 'snow' && <>
        <div className={classes['sc-cloud']} style={{ '--dx':'-6%', '--dur':'25s', '--op':'0.7', '--scale':'1' }} />
        {Array.from({ length: 24 }, (_, i) => (
          <div key={i} className={classes['snowflake']}
            style={{
              '--x': `${(i * 4.2 + Math.sin(i * 2) * 8).toFixed(1)}%`,
              '--delay': `${(i * 0.18 % 3.5).toFixed(2)}s`,
              '--dur': `${(2.5 + (i % 5) * 0.4).toFixed(1)}s`,
              '--size': `${3 + (i % 3) * 1.5}px`,
            }}
          />
        ))}
      </>}

      {/* ── Fog ── */}
      {scene === 'fog' && <>
        {[0,1,2,3].map(i => (
          <div key={i} className={classes['fog-band']}
            style={{ '--i': i, '--delay': `${i * 1.1}s` }} />
        ))}
      </>}

    </div>
  )
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

  const highColor  = tempColor(high, units)
  const lowColor   = tempColor(low,  units)
  const mainColor  = tempColor(temp, units)
  const scene      = iconToScene(icon)
  const windCardinal = toCardinal(windDir)

  const days = buildForecastDays(forecast?.list, maxDays)

  const stats = [
    { icon: <FiDroplet size={18} />, value: `${humidity}%`,              label: 'Humidity' },
    { icon: <FiWind size={18} />, value: `${windSpeed} m/s ${windCardinal}`, label: 'Wind' },
    ...(visibility ? [{ icon: <FiEye size={18} />, value: visibility, label: 'Visibility' }] : []),
    { icon: <FiThermometer size={18} />, value: `${feelsLike}${units}`,      label: 'Feels like' },
  ]

  return createPortal(
    <AnimatePresence>
      <motion.div
        className={classes['backdrop']}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onPointerDown={handleBackdrop}
        data-keep-focus="true">

        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Weather in ${cityName}`}
          tabIndex={-1}
          className={classes['modal']}
          initial={{ opacity: 0, scale: 0.93, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 16 }}
          transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}>

        {/* ── Hero panel with animated scene ── */}
        <div className={`${classes['hero']} ${classes[`hero--${scene}`]}`}>
          <AnimatedScene scene={scene} />

          {/* close */}
          <button
            type="button"
            className={classes['close']}
            onClick={onClose}
            aria-label="Close weather">
            <FiX size={16} />
          </button>

          {/* city + stale badge */}
          <div className={classes['hero-meta']}>
            <span className={classes['city']}>{cityName}</span>
            {isStale && <span className={classes['stale-badge']}>Cached data</span>}
          </div>

          {/* main current weather */}
          <div className={classes['hero-body']}>
            <div className={classes['hero-icon']}>
              <WeatherIcon code={icon} size={80} />
            </div>
            <div className={classes['hero-info']}>
              <div className={classes['hero-temp']} style={{ color: mainColor }}>
                {temp}{units}
              </div>
              <div className={classes['hero-desc']}>{desc}</div>
              <div className={classes['hero-hilo']}>
                <span style={{ color: highColor }}>↑ {high}{units}</span>
                <span style={{ opacity: 0.4, margin: '0 6px' }}>·</span>
                <span style={{ color: lowColor }}>↓ {low}{units}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className={classes['stats']}>
          {stats.map(s => (
            <div key={s.label} className={classes['stat']}>
              <span className={classes['stat-icon']}>{s.icon}</span>
              <span className={classes['stat-val']}>{s.value}</span>
              <span className={classes['stat-label']}>{s.label}</span>
            </div>
          ))}
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
                  <div className={classes['day-icon']}>
                    <WeatherIcon code={ic} size={36} />
                  </div>
                  <div className={classes['day-high']} style={{ color: hc }}>↑ {h}{units}</div>
                  <div className={classes['day-low']}  style={{ color: lc }}>↓ {l}{units}</div>
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
