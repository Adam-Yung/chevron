import { memo } from 'react'
import useOnlineStatus from './useOnlineStatus'
import classes from './OfflineIndicator.module.css'

// pointer-events: none so the pill can never block input; aria-live so screen readers hear transitions without being interrupted.
function OfflineIndicator() {
  const online = useOnlineStatus()
  return (
    <div
      className={`${classes['pill']}${online ? '' : ' ' + classes['visible']}`}
      data-testid="offline-pill"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className={classes['dot']} aria-hidden="true" />
      <span>{online ? 'Online' : 'Offline — search will retry when you reconnect'}</span>
    </div>
  )
}

export default memo(OfflineIndicator)
