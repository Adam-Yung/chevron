import { useEffect } from 'react'
import { useDispatch, useUi } from '../state/UiStore'
import { ui } from '../state/ui'
import classes from './Notice.module.css'

const SHOW_MS = 1600

/** A short-lived status line ("Copied", "Removed from history"). Each notice clears only itself, so a newer one is never cut short. */
export default function Notice() {
  const notice = useUi(s => s.notice)
  const dispatch = useDispatch()
  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => dispatch(ui.noticeCleared(notice.id)), SHOW_MS)
    return () => clearTimeout(timer)
  }, [notice, dispatch])
  return (
    <div className={classes.notice} role='status' aria-live='polite'>
      {notice && <span key={notice.id} className={classes.pill}>{notice.text}</span>}
    </div>
  )
}
