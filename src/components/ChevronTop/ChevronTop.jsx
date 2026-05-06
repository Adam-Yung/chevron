import { lazy, Suspense, useContext } from 'react'
import { SettingsContext } from '../../contexts/Settings'
import Time from '../Time/Time'
import classes from './ChevronTop.module.css'

// Phase 8d: lazy-load the Weather chunk so it never touches the initial
// paint bundle. Falls under a Suspense with no fallback so the row simply
// shows the clock until the chunk + first data load.
const Weather = lazy(() => import('../Weather/Weather'))

function ChevronTop() {
  const settings = useContext(SettingsContext)
  const apiKey = settings.weather?.apiKey ?? ''
  const lat    = settings.weather?.lat    ?? ''
  // Weather slot is only rendered when both key and coords are configured.
  const weatherEnabled = Boolean(apiKey && lat)

  return (
    <div className={`${classes['top']} ${weatherEnabled ? '' : classes['centered']}`}>
      {weatherEnabled && (
        <Suspense fallback={null}>
          <Weather />
        </Suspense>
      )}
      <Time />
    </div>
  )
}

export default ChevronTop
