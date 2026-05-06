import { useContext, useEffect, useState } from 'react'
import { SettingsContext } from '../../contexts/Settings'
import formatDate from '../../functions/generationUtils/formatDate'
import classes from './Time.module.css'

function Time() {
  const settings = useContext(SettingsContext)
  const fontSize = settings.menu.time.fontSize
  const format = settings.menu.time.format

  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={classes['time']} style={{ '--font-size': fontSize + 'em' }}>
      {formatDate(now, format)}
    </div>
  )
}

export default Time
