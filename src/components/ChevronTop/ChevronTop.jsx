import { lazy, Suspense, useContext } from 'react'
import { SettingsContext } from '../../contexts/Settings'
import Time from '../Time/Time'
import classes from './ChevronTop.module.css'

// Phase 8d_cont: when weather is enabled, Weather renders the FULL row
// ([TIME] · [temp] [emoji]) as a single clickable button. When disabled,
// just the clock is rendered centered.
const Weather = lazy(() => import('../Weather/Weather'))

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
