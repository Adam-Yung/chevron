import { useEffect, useRef } from 'react'

function useGestures({ onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight }) {
  const cbRef = useRef({ onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight })
  useEffect(() => {
    cbRef.current = { onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight }
  })

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

      if (dt > 600) return
      const absX = Math.abs(dx), absY = Math.abs(dy)
      if (Math.max(absX, absY) < 60) return

      if (absY > absX) {
        if (dy < 0) cbRef.current.onSwipeUp?.()
        else        cbRef.current.onSwipeDown?.()
      } else {
        if (dx < 0) cbRef.current.onSwipeLeft?.()
        else        cbRef.current.onSwipeRight?.()
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend',   onTouchEnd,   { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend',   onTouchEnd)
    }
  }, [])
}

export default useGestures
