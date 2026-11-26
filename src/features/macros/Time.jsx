import { useContext } from 'react'
import { SettingsContext } from '../../settings/SettingsProvider'
import formatDate from '../../lib/formatDate'
import useClock from './useClock'
import classes from './Time.module.css'

function Time() {
  const settings = useContext(SettingsContext)
  const fontSize = settings.menu.time.fontSize
  const format = settings.menu.time.format

  // Wall-clock-aligned tick that pauses while the tab is hidden.
  const now = useClock()

  return (
    <div className={classes['time']} style={{ '--font-size': fontSize + 'em' }}>
      {formatDate(now, format)}
    </div>
  )
}

export default Time
