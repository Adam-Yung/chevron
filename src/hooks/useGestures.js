import { useEffect, useRef } from 'react'

/**
 * Touch swipe gesture engine.
 *
 * Tracks a single-finger drag from touchstart through touchmove to touchend
 * and fires directional callbacks. A swipe is recognised when EITHER the
 * total distance clears `threshold` OR the terminal velocity clears
 * `velocityThreshold` (a quick flick), which makes short, fast gestures feel
 * responsive on large tablet screens while still rejecting accidental taps.
 *
 * During the drag it emits `onProgress({ direction, progress })` where
 * `progress` is the distance along the dominant axis normalised against
 * `threshold` and clamped to [0, 1] — intended to drive interactive
 * "drag to reveal" animations.
 *
 * @param {object}   opts
 * @param {Function} [opts.onSwipeUp]
 * @param {Function} [opts.onSwipeDown]
 * @param {Function} [opts.onSwipeLeft]
 * @param {Function} [opts.onSwipeRight]
 * @param {Function} [opts.onProgress]      ({ direction, progress }) => void
 * @param {Function} [opts.onGestureStart]  () => void
 * @param {Function} [opts.onGestureEnd]    ({ committed }) => void
 * @param {boolean}  [opts.enabled=true]    master on/off switch
 * @param {number}   [opts.threshold=40]    px of travel to commit a swipe
 * @param {number}   [opts.velocityThreshold=0.3]  px/ms flick velocity to commit
 * @param {number}   [opts.timeLimit=600]   max gesture duration (ms)
 */
function useGestures({
  onSwipeUp,
  onSwipeDown,
  onSwipeLeft,
  onSwipeRight,
  onProgress,
  onGestureStart,
  onGestureEnd,
  enabled = true,
  threshold = 40,
  velocityThreshold = 0.3,
  timeLimit = 600,
} = {}) {
  // Keep all callbacks and tunables in a ref so the window listeners are
  // bound exactly once and never need re-attaching when a handler identity
  // changes between renders.
  const cfgRef = useRef(null)
  cfgRef.current = {
    onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight,
    onProgress, onGestureStart, onGestureEnd,
    enabled, threshold, velocityThreshold, timeLimit,
  }

  useEffect(() => {
    let startX, startY, startT, active, axis

    const reset = () => {
      startX = startY = startT = undefined
      active = false
      axis = null
    }

    const onTouchStart = (e) => {
      if (!cfgRef.current.enabled) return
      // Only track single-finger gestures; let multi-touch (pinch) pass.
      if (e.touches.length !== 1) { reset(); return }
      const t = e.touches[0]
      startX = t.clientX
      startY = t.clientY
      startT = performance.now()
      active = true
      axis = null
      cfgRef.current.onGestureStart?.()
    }

    const onTouchMove = (e) => {
      if (!active || startX === undefined) return
      const t = e.touches[0]
      const dx = t.clientX - startX
      const dy = t.clientY - startY
      const absX = Math.abs(dx), absY = Math.abs(dy)

      // Lock the axis once the gesture shows a clear dominant direction.
      if (!axis && Math.max(absX, absY) > 8) {
        axis = absY > absX ? 'y' : 'x'
      }
      if (!axis) return

      let direction, dist
      if (axis === 'y') {
        direction = dy < 0 ? 'up' : 'down'
        dist = absY
      } else {
        direction = dx < 0 ? 'left' : 'right'
        dist = absX
      }
      const progress = Math.min(1, dist / cfgRef.current.threshold)
      cfgRef.current.onProgress?.({ direction, progress })
    }

    const fire = (direction) => {
      const cb = cfgRef.current
      switch (direction) {
        case 'up':    cb.onSwipeUp?.();    break
        case 'down':  cb.onSwipeDown?.();  break
        case 'left':  cb.onSwipeLeft?.();  break
        case 'right': cb.onSwipeRight?.(); break
      }
    }

    const onTouchEnd = (e) => {
      if (!active || startX === undefined) { reset(); return }
      const cfg = cfgRef.current
      const t = e.changedTouches[0]
      const dx = t.clientX - startX
      const dy = t.clientY - startY
      const dt = performance.now() - startT
      const absX = Math.abs(dx), absY = Math.abs(dy)
      const dominant = Math.max(absX, absY)
      const useAxis = axis || (absY > absX ? 'y' : 'x')

      let committed = false
      if (dt <= cfg.timeLimit && dominant > 8) {
        const dist = useAxis === 'y' ? absY : absX
        const velocity = dist / Math.max(1, dt) // px/ms along dominant axis
        const metDistance = dist >= cfg.threshold
        const metVelocity = velocity >= cfg.velocityThreshold && dist >= cfg.threshold / 2
        if (metDistance || metVelocity) {
          if (useAxis === 'y') fire(dy < 0 ? 'up' : 'down')
          else                 fire(dx < 0 ? 'left' : 'right')
          committed = true
        }
      }

      cfg.onGestureEnd?.({ committed })
      reset()
    }

    const onTouchCancel = () => {
      if (active) cfgRef.current.onGestureEnd?.({ committed: false })
      reset()
    }

    window.addEventListener('touchstart',  onTouchStart,  { passive: true })
    window.addEventListener('touchmove',   onTouchMove,   { passive: true })
    window.addEventListener('touchend',    onTouchEnd,    { passive: true })
    window.addEventListener('touchcancel', onTouchCancel, { passive: true })
    return () => {
      window.removeEventListener('touchstart',  onTouchStart)
      window.removeEventListener('touchmove',   onTouchMove)
      window.removeEventListener('touchend',    onTouchEnd)
      window.removeEventListener('touchcancel', onTouchCancel)
    }
  }, [])
}

export default useGestures
