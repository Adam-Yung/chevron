import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * Computes an adaptive font size that shrinks smoothly as text gets longer,
 * using a canvas measurement approach (no layout thrashing).
 */
export default function useAdaptiveFontSize(text, {
  maxFontSize = 5,
  minFontSize = 0.9,
  containerRef = null,
  fontFamily = 'inherit'
} = {}) {
  const [fontSize, setFontSize] = useState(maxFontSize)
  const canvasRef = useRef(null)

  const measure = useCallback(() => {
    if (!containerRef?.current) return maxFontSize

    const containerWidth = containerRef.current.clientWidth
    if (!containerWidth) return maxFontSize

    if (!text || text.length === 0) return maxFontSize

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas').getContext('2d')
    }
    const ctx = canvasRef.current

    const parentFontSize = parseFloat(getComputedStyle(containerRef.current).fontSize) || 16
    const maxPx = maxFontSize * parentFontSize
    const minPx = minFontSize * 16

    ctx.font = `600 ${maxPx}px ${fontFamily}`
    const textWidth = ctx.measureText(text.toUpperCase()).width

    const availableWidth = containerWidth * 0.95
    if (textWidth <= availableWidth) return maxFontSize

    const ratio = availableWidth / textWidth
    const scaledPx = maxPx * ratio

    if (scaledPx <= minPx) {
      return minPx / parentFontSize
    }

    return scaledPx / parentFontSize
  }, [text, maxFontSize, minFontSize, containerRef, fontFamily])

  useEffect(() => {
    setFontSize(measure())
  }, [measure])

  useEffect(() => {
    const handleResize = () => setFontSize(measure())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [measure])

  return fontSize
}
