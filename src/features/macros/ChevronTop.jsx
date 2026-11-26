import { lazy, Suspense, useContext } from 'react'
import { SettingsContext } from '../../settings/SettingsProvider'
import Time from './Time'
import classes from './ChevronTop.module.css'

// With weather configured, Weather renders the whole row (clock, temperature, icon) as one button; otherwise just the clock.
const Weather = lazy(() => import('../weather/Weather'))

function ChevronTop() {
  const settings       = useContext(SettingsContext)
  const weatherEnabled = Boolean(settings.weather?.apiKey && settings.weather?.lat)

  if (!weatherEnabled) {
    return <div className={`${classes['top']} ${classes['centered']}`}><Time /></div>
  }

  // Suspense fallback shows just the clock while the Weather chunk loads.
  return (
    <Suspense fallback={<div className={`${classes['top']} ${classes['centered']}`}><Time /></div>}>
      <div className={classes['top']}>
        <Weather />
      </div>
    </Suspense>
  )
}

export default ChevronTop
