import { memo } from 'react'
import useOnlineStatus from '../../hooks/useOnlineStatus'
import classes from './OfflineIndicator.module.css'

/**
 * Tiny pill that appears when the browser reports `offline`. It is
 * pointer-events: none so it never blocks the UI, and aria-live=polite
 * so screen readers announce online/offline transitions without
 * interrupting the user.
 */
function OfflineIndicator() {
  const online = useOnlineStatus()
  return (
    <div
      className={`${classes['pill']}${online ? '' : ' ' + classes['visible']}`}
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
