import { useCallback, useEffect, useRef, useState } from 'react'
import { useUi } from '../../state/UiStore'
import { BsChevronUp, BsChevronLeft } from 'react-icons/bs'
import classes from './GestureHints.module.css'

const STORAGE_KEY = 'touchHintsSeen'
const AUTO_DISMISS_MS = 5000

function supportsTouch() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches
  )
}

// Faint swipe hints for first-run touch users only (coarse pointer, flag unset). They fade on the first touch or after
// AUTO_DISMISS_MS and the flag is stored, so they never come back; the CSS swaps the nudge for static arrows under reduced motion.
function GestureHints() {
  const [show, setShow] = useState(() => {
    if (!supportsTouch()) return false
    try {
      return !localStorage.getItem(STORAGE_KEY)
    } catch {
      return false
    }
  })
  const [leaving, setLeaving] = useState(false)
  const view = useUi(s => s.view)
  const dismissedRef = useRef(false)

  // The fade is a CSS class; unmounting after it is cleanup, not state the UI depends on.
  const dismiss = useCallback(() => {
    if (dismissedRef.current) return
    dismissedRef.current = true
    try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore */ }
    setLeaving(true)
    window.setTimeout(() => setShow(false), 450)
  }, [])

  // Searching or opening the sites menu is the user having used the app: the hints have done their job and would
  // otherwise sit on top of the query text and the menu.
  useEffect(() => {
    if (show && view !== 'idle') dismiss()
  }, [show, view, dismiss])

  useEffect(() => {
    if (!show) return
    window.addEventListener('touchstart', dismiss, { passive: true, once: true })
    const timer = window.setTimeout(dismiss, AUTO_DISMISS_MS)
    return () => {
      window.removeEventListener('touchstart', dismiss)
      window.clearTimeout(timer)
    }
  }, [show, dismiss])

  if (!show) return null

  return (
    <div
      className={leaving ? `${classes['overlay']} ${classes['leaving']}` : classes['overlay']}
      aria-hidden="true">
      <div className={`${classes['hint']} ${classes['up']}`}>
        <span className={classes['arrow']}><BsChevronUp /></span>
        <span className={classes['label']}>Macros</span>
      </div>
      <div className={`${classes['hint']} ${classes['left']}`}>
        <span className={classes['arrow']}><BsChevronLeft /></span>
        <span className={classes['label']}>Search</span>
      </div>
    </div>
  )
}

export default GestureHints
