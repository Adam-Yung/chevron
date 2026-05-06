import { useEffect } from 'react'

// Phase 8e: touch swipe gesture hook.
// Recognises directional swipes on the window and calls the matching
// callback. Left/right are exposed but not wired in App.jsx — Splide
// handles in-menu horizontal swipes natively, so we don't double-fire.
//
// Thresholds (per spec § 3.7.1):
//   - Max gesture duration: 600 ms  (too slow = scroll, not swipe)
//   - Min displacement:      60 px  (too short = tap/jitter, not swipe)
//
// All listeners are passive so they never block scrolling.
function useGestures({ onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight }) {
  useEffect(() => {
    let startX, startY, startT

    const onTouchStart = (e) => {
      const t = e.touches[0]
      startX = t.clientX
      startY = t.clientY
      startT = performance.now()
    }

    const onTouchEnd = (e) => {
      if (startX === undefined) return
      const t   = e.changedTouches[0]
      const dx  = t.clientX - startX
      const dy  = t.clientY - startY
      const dt  = performance.now() - startT

      if (dt > 600) return                                // too slow
      const absX = Math.abs(dx), absY = Math.abs(dy)
      if (Math.max(absX, absY) < 60) return              // too short

      if (absY > absX) {
        if (dy < 0) onSwipeUp?.()
        else        onSwipeDown?.()
      } else {
        if (dx < 0) onSwipeLeft?.()
        else        onSwipeRight?.()
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend',   onTouchEnd,   { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend',   onTouchEnd)
    }
  }, [onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight])
}

export default useGestures
