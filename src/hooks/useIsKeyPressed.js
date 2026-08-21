import { useState, useEffect, useRef } from 'react'

const STUCK_KEY_TIMEOUT_MS = 5000

function useIsKeyPressed(keyName) {
  const [isKeyPressed, setIsKeyPressed] = useState(false)
  const stuckTimerRef = useRef(null)

  useEffect(() => {
    const clearStuckTimer = () => {
      if (stuckTimerRef.current) {
        clearTimeout(stuckTimerRef.current)
        stuckTimerRef.current = null
      }
    }

    const onKeyDown = e => {
      if (e.key === keyName) {
        setIsKeyPressed(true)
        clearStuckTimer()
        stuckTimerRef.current = setTimeout(() => {
          setIsKeyPressed(false)
        }, STUCK_KEY_TIMEOUT_MS)
      }
    }
    const onKeyUp = e => {
      if (e.key === keyName) {
        setIsKeyPressed(false)
        clearStuckTimer()
      }
    }
    const onBlur = () => {
      setIsKeyPressed(false)
      clearStuckTimer()
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      clearStuckTimer()
    }
  }, [keyName])

  return isKeyPressed
}

export default useIsKeyPressed
