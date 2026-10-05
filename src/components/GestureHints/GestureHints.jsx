import { useEffect, useRef, useState } from 'react'
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

/**
 * Phase 12: first-run onboarding hints for touch users.
 *
 * Shows faint directional affordances (swipe up = macros, swipe left =
 * search) only on coarse-pointer devices, and only until the user performs
 * their first gesture or ~5s elapse — then it fades out and records a
 * localStorage flag so it never shows again. Respects prefers-reduced-motion
 * via the CSS (static arrows instead of nudging).
 */
function GestureHints() {
  // Decide once, on mount, whether to show at all. Not shown on fine-pointer
  // devices or once the flag is set.
  const [show, setShow] = useState(() => {
    if (!supportsTouch()) return false
    try {
      return !localStorage.getItem(STORAGE_KEY)
    } catch {
      return false
    }
  })
  const [leaving, setLeaving] = useState(false)
  const dismissedRef = useRef(false)

  useEffect(() => {
    if (!show) return

    const markSeen = () => {
      try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore */ }
    }

    // Begin the fade, then unmount after the transition completes.
    const dismiss = () => {
      if (dismissedRef.current) return
      dismissedRef.current = true
      markSeen()
      setLeaving(true)
      window.setTimeout(() => setShow(false), 450)
    }

    // Dismiss on the user's first touch gesture.
    const onFirstTouch = () => dismiss()
    window.addEventListener('touchstart', onFirstTouch, { passive: true, once: true })

    // Or after a timeout if they just stare at it.
    const timer = window.setTimeout(dismiss, AUTO_DISMISS_MS)

    return () => {
      window.removeEventListener('touchstart', onFirstTouch)
      window.clearTimeout(timer)
    }
  }, [show])

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
