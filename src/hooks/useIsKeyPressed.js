import { useState, useEffect } from 'react'

function useIsKeyPressed(keyName) {
  const [isKeyPressed, setIsKeyPressed] = useState(false)

  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === keyName) setIsKeyPressed(true)
    }
    const onKeyUp = e => {
      if (e.key === keyName) setIsKeyPressed(false)
    }
    // reset state if window loses focus while key is held (prevents stuck "pressed")
    const onBlur = () => setIsKeyPressed(false)

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [keyName])

  return isKeyPressed
}

export default useIsKeyPressed
