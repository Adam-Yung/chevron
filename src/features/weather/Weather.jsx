import { useContext, useState } from 'react'
import { SettingsContext } from '../../settings/SettingsProvider'
import useOnlineStatus from '../status/useOnlineStatus'
import useWeather from './useWeather'
import WeatherModal from './WeatherModal'
import { WeatherIcon } from './WeatherIcon'
import Time from '../macros/Time'
import classes from './Weather.module.css'

const UNIT_SYMBOLS = { metric: '°C', imperial: '°F', standard: 'K' }

// Weather for the place in the settings, with the display choices that go with it.
function useConfiguredWeather() {
  const { weather = {} } = useContext(SettingsContext)
  const online = useOnlineStatus()
  const units = weather.units ?? 'metric'
  const data = useWeather({
    apiKey: weather.apiKey ?? '',
    lat: weather.lat ?? '',
    lon: weather.lon ?? '',
    units,
    online
  })
  return { ...data, unitSymbol: UNIT_SYMBOLS[units] ?? UNIT_SYMBOLS.metric, maxDays: weather.forecastDays ?? 5 }
}

function Chip({ data, unitSymbol, onClick }) {
  const temp = Math.round(data.main?.temp ?? 0)
  const { icon, description = '' } = data.weather?.[0] ?? {}
  return (
    <button
      type="button"
      className={classes['row']}
      onClick={onClick}
      title={`${description} — click for forecast`}
      aria-label={`${temp}${unitSymbol}, ${description}. Click for weather details.`}>
      <Time />
      <span className={classes['sep']}>·</span>
      <span className={classes['temp']}>{temp}{unitSymbol}</span>
      <span className={classes['icon']}><WeatherIcon code={icon} size={48} /></span>
    </button>
  )
}

// The whole top row: clock, then temperature and icon as one button that opens the forecast modal. Without data it is the bare
// clock, with no placeholder text, so the row does not change size while a fetch is in flight.
export default function Weather() {
  const { current, forecast, stale, unitSymbol, maxDays } = useConfiguredWeather()
  const [showModal, setShowModal] = useState(false)

  if (!current?.data) return <div className={classes['row-plain']}><Time /></div>

  return (
    <>
      <Chip data={current.data} unitSymbol={unitSymbol} onClick={() => setShowModal(true)} />

      {showModal && (
        <WeatherModal
          current={current.data}
          forecast={forecast?.data}
          units={unitSymbol}
          maxDays={maxDays}
          isStale={stale}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
