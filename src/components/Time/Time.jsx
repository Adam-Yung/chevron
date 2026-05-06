import { useContext, useSyncExternalStore } from 'react'
import { SettingsContext } from '../../contexts/Settings'
import formatDate from '../../functions/generationUtils/formatDate'
import { getTime, subscribeTime } from './timeStore'
import classes from './Time.module.css'

// Phase 8b: subscribes to the singleton timeStore so the displayed
// time keeps ticking even if this component unmounts/remounts (which
// happens when the AnimatePresence container is keyed off `timestamp`
// and the store is reset).
function Time() {
  /* settings */
  const settings = useContext(SettingsContext)

  const fontSize = settings.menu.time.fontSize
  const format = settings.menu.time.format

  const time = useSyncExternalStore(subscribeTime, getTime)

  const variables = {
    '--font-size': fontSize + 'em'
  }

  return (
    <div className={classes['time']} style={variables}>
      {formatDate(time, format)}
    </div>
  )
}

export default Time
