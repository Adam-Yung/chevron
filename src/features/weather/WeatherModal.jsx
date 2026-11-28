import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { FiDroplet, FiWind, FiEye, FiThermometer, FiX } from 'react-icons/fi'
import { closeOnBackdrop, closeOnEscape } from '../../app/dialogEvents'
import { WeatherIcon, iconToScene } from './WeatherIcon'
import WeatherScene from './WeatherScene'
import { buildForecastDays, tempColor, toCardinal } from './forecast'
import classes from './WeatherModal.module.css'

function buildStats({ main = {}, wind = {}, visibility }, units) {
  const temp = Math.round(main.temp ?? 0)
  return [
    { icon: <FiDroplet size={18} />, value: `${main.humidity ?? 0}%`, label: 'Humidity' },
    { icon: <FiWind size={18} />, value: `${Math.round(wind.speed ?? 0)} m/s ${toCardinal(wind.deg ?? 0)}`, label: 'Wind' },
    ...(visibility ? [{ icon: <FiEye size={18} />, value: `${Math.round(visibility / 1000)} km`, label: 'Visibility' }] : []),
    { icon: <FiThermometer size={18} />, value: `${Math.round(main.feels_like ?? temp)}${units}`, label: 'Feels like' }
  ]
}

function Stats({ current, units }) {
  return (
    <div className={classes['stats']}>
      {buildStats(current, units).map(s => (
        <div key={s.label} className={classes['stat']}>
          <span className={classes['stat-icon']}>{s.icon}</span>
          <span className={classes['stat-val']}>{s.value}</span>
          <span className={classes['stat-label']}>{s.label}</span>
        </div>
      ))}
    </div>
  )
}

function Conditions({ current, units }) {
  const { main = {}, weather } = current
  const temp = Math.round(main.temp ?? 0)
  const high = Math.round(main.temp_max ?? temp)
  const low = Math.round(main.temp_min ?? temp)
  const { icon, description = '' } = weather?.[0] ?? {}
  return (
    <div className={classes['hero-body']}>
      <div className={classes['hero-icon']}><WeatherIcon code={icon} size={80} /></div>
      <div className={classes['hero-info']}>
        <div className={classes['hero-temp']} style={{ color: tempColor(temp, units) }}>{temp}{units}</div>
        <div className={classes['hero-desc']}>{description}</div>
        <div className={classes['hero-hilo']}>
          <span style={{ color: tempColor(high, units) }}>↑ {high}{units}</span>
          <span style={{ opacity: 0.4, margin: '0 6px' }}>·</span>
          <span style={{ color: tempColor(low, units) }}>↓ {low}{units}</span>
        </div>
      </div>
    </div>
  )
}

function Hero({ current, units, isStale, onClose }) {
  const scene = iconToScene(current.weather?.[0]?.icon)
  return (
    <div className={`${classes['hero']} ${classes[`hero--${scene}`]}`}>
      <WeatherScene scene={scene} />
      <button type="button" className={classes['close']} onClick={onClose} aria-label="Close weather">
        <FiX size={16} />
      </button>
      <div className={classes['hero-meta']}>
        <span className={classes['city']}>{current.name ?? ''}</span>
        {isStale && <span className={classes['stale-badge']}>Cached data</span>}
      </div>
      <Conditions current={current} units={units} />
    </div>
  )
}

function ForecastStrip({ days, units }) {
  return (
    <div className={classes['forecast']}>
      {days.map(({ label, high, low, icon }) => (
        <div key={label} className={classes['day-card']}>
          <div className={classes['day-label']}>{label.split(',')[0]}</div>
          <div className={classes['day-date']}>{label.split(',').slice(1).join(',').trim()}</div>
          <div className={classes['day-icon']}><WeatherIcon code={icon} size={36} /></div>
          <div className={classes['day-high']} style={{ color: tempColor(high, units) }}>↑ {high}{units}</div>
          <div className={classes['day-low']} style={{ color: tempColor(low, units) }}>↓ {low}{units}</div>
        </div>
      ))}
    </div>
  )
}

// Focus moves into the dialog so Esc works from the first keypress, and goes back where it was when the dialog closes.
function useDialogFocus() {
  const dialogRef = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    dialogRef.current?.focus()
    return () => { if (previous?.isConnected) previous.focus() }
  }, [])
  return dialogRef
}

export default function WeatherModal({ current, forecast, units, maxDays, isStale, onClose }) {
  const dialogRef = useDialogFocus()
  const days = buildForecastDays(forecast?.list, maxDays)

  // The whole backdrop listens so Esc works wherever focus ended up inside the dialog.
  return createPortal(
    <div
      className={classes['backdrop']}
      onPointerDown={e => closeOnBackdrop(e, onClose)}
      onKeyDown={e => closeOnEscape(e, onClose)}
      data-keep-focus="true">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Weather in ${current.name ?? ''}`}
        tabIndex={-1}
        className={classes['modal']}>
        <Hero current={current} units={units} isStale={isStale} onClose={onClose} />
        <Stats current={current} units={units} />
        {days.length > 0 && <ForecastStrip days={days} units={units} />}
      </div>
    </div>,
    document.getElementById('root')
  )
}
