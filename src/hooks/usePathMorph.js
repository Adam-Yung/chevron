import { useRef, useCallback } from 'react'

const supportsWaapiD = typeof CSS !== 'undefined'
  && typeof CSS.supports === 'function'
  && CSS.supports('d', 'path("M0,0 L1,1")')

/**
 * Convert a JS easing function to a CSS linear() string by sampling it.
 * For string easings ('ease-in', 'linear', etc.), pass through as-is.
 */
function easingToCss(ease) {
  if (typeof ease === 'string') {
    if (ease === 'easeIn') return 'ease-in'
    if (ease === 'easeOut') return 'ease-out'
    if (ease === 'easeInOut') return 'ease-in-out'
    return ease
  }
  if (typeof ease !== 'function') return 'ease'
  const steps = 16
  const points = []
  for (let i = 0; i <= steps; i++) points.push(ease(i / steps).toFixed(4))
  return `linear(${points.join(',')})`
}

/**
 * Hook that drives SVG path `d` morphing via the Web Animations API
 * on browsers that support it (Chrome, Firefox), falling back to
 * Framer Motion's controls.start() on Safari.
 */
export default function usePathMorph(pathRef, fallbackControls) {
  const currentD = useRef(null)
  const activeAnimation = useRef(null)

  const morph = useCallback((toPath, { duration, ease, delay = 0 }) => {
    const el = pathRef.current
    if (!el) return Promise.resolve()

    if (activeAnimation.current) {
      activeAnimation.current.finish()
      activeAnimation.current = null
    }

    if (!supportsWaapiD) {
      return fallbackControls.start({
        d: toPath,
        transition: { duration, ease, delay }
      })
    }

    const fromPath = currentD.current || el.getAttribute('d')
    const cssEasing = easingToCss(ease)

    const animation = el.animate(
      [
        { d: `path("${fromPath}")` },
        { d: `path("${toPath}")` }
      ],
      {
        duration: duration * 1000,
        delay: delay * 1000,
        easing: cssEasing,
        fill: 'forwards'
      }
    )

    activeAnimation.current = animation
    currentD.current = toPath

    return animation.finished.then(() => {
      el.setAttribute('d', toPath)
      activeAnimation.current = null
    })
  }, [pathRef, fallbackControls])

  const setInitialD = useCallback((d) => {
    currentD.current = d
  }, [])

  return { morph, setInitialD, supportsWaapi: supportsWaapiD }
}
