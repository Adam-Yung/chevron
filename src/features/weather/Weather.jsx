import { useContext, useState } from 'react'
import { SettingsContext } from '../../settings/SettingsProvider'
import useOnlineStatus from '../status/useOnlineStatus'
import useWeather from './useWeather'
import WeatherModal from './WeatherModal'
import { WeatherIcon } from './WeatherIcon'
import Time from '../macros/Time'
import classes from './Weather.module.css'

const UNIT_SYMBOLS = { metric: '°C', imperial: '°F', standard: 'K' }

/**
 * The whole top row: clock, then temperature and icon as one button that opens the forecast modal. Without data it renders
 * the bare clock, with no placeholder text, so the row does not change size while a fetch is in flight.
 */
export default function Weather() {
  const { weather = {} } = useContext(SettingsContext)
  const online = useOnlineStatus()
  const units = weather.units ?? 'metric'
  const { current, forecast, stale } = useWeather({
    apiKey: weather.apiKey ?? '',
    lat: weather.lat ?? '',
    lon: weather.lon ?? '',
    units,
    online
  })
  const [showModal, setShowModal] = useState(false)

  if (!current?.data) return <div className={classes['row-plain']}><Time /></div>

  const temp = Math.round(current.data.main?.temp ?? 0)
  const { icon, description = '' } = current.data.weather?.[0] ?? {}
  const unitSymbol = UNIT_SYMBOLS[units] ?? UNIT_SYMBOLS.metric

  return (
    <>
      <button
        type="button"
        className={classes['row']}
        onClick={() => setShowModal(true)}
        title={`${description} — click for forecast`}
        aria-label={`${temp}${unitSymbol}, ${description}. Click for weather details.`}>
        <Time />
        <span className={classes['sep']}>·</span>
        <span className={classes['temp']}>{temp}{unitSymbol}</span>
        <span className={classes['icon']}><WeatherIcon code={icon} size={48} /></span>
      </button>

      {showModal && (
        <WeatherModal
          current={current.data}
          forecast={forecast?.data}
          units={unitSymbol}
          maxDays={weather.forecastDays ?? 5}
          isStale={stale}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
