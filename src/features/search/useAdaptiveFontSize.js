import { useLayoutEffect, useMemo, useState } from 'react'

const MIN_REM = 0.9
let measureCtx = null

function textWidth(text, px, family) {
  measureCtx ??= document.createElement('canvas').getContext('2d')
  if (!measureCtx) return 0
  measureCtx.font = `400 ${px}px ${family}`
  return measureCtx.measureText(text.toUpperCase()).width
}

function boxMetrics(el) {
  const style = getComputedStyle(el)
  return {
    width: el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
    basePx: parseFloat(style.fontSize) || 16,
    family: style.getPropertyValue('--font-display').trim() || style.fontFamily || 'sans-serif'
  }
}

const measureBox = (el, setBox) => setBox(b => ({ ...b, ...boxMetrics(el) }))

// The largest size (em of the container) at which `text` fits one line, down to a floor; computed during render, so no keystroke
// paints one frame at the old size. Returns a ref callback for the container, and the size.
export default function useAdaptiveFontSize(text, max) {
  const [box, setBox] = useState({ el: null, width: 0, basePx: 16, family: 'sans-serif' })

  useLayoutEffect(() => {
    const el = box.el
    if (!el) return undefined
    measureBox(el, setBox)
    const observer = new ResizeObserver(() => measureBox(el, setBox))
    observer.observe(el)
    return () => observer.disconnect()
  }, [box.el])

  const size = useMemo(() => {
    if (!text || !box.width) return max
    const maxPx = max * box.basePx
    const fits = (box.width * 0.95) / Math.max(textWidth(text, maxPx, box.family), 1)
    if (fits >= 1) return max
    return Math.max(MIN_REM * 16, maxPx * fits) / box.basePx
  }, [text, max, box])

  const ref = useMemo(() => el => setBox(b => (b.el === el ? b : { ...b, el })), [])
  return [ref, size]
}
