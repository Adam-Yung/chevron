import { useRef, useEffect, useMemo, useCallback } from 'react'
import parseStages from './parseStages'
import CanvasRenderer from './canvasRenderer'
import ChevronWorker from './chevron.worker.js?worker'

const INTERNAL_WIDTH = 1920
const INTERNAL_HEIGHT = 1920

/**
 * Canvas-based chevron path renderer.
 * Uses OffscreenCanvas + Web Worker when available (zero main-thread cost),
 * falls back to main-thread Canvas (still 10-20x faster than SVG).
 */
export default function useChevronCanvas(canvasRef, { size, color, thickness }) {
  const rendererRef = useRef(null)

  const stages = useMemo(() => parseStages(size), [size])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const stagesArrays = stages.map(s => Array.from(s))
    // Scale thickness: SVG used non-scaling-stroke (screen pixels).
    // Canvas internal height is 1920 displayed at 100vh, so scale accordingly.
    const scaledThickness = thickness * (INTERNAL_HEIGHT / window.innerHeight)

    if (typeof OffscreenCanvas !== 'undefined' && canvas.transferControlToOffscreen) {
      try {
        const offscreen = canvas.transferControlToOffscreen()
        const worker = new ChevronWorker()
        worker.postMessage({
          type: 'init',
          canvas: offscreen,
          width: INTERNAL_WIDTH,
          height: INTERNAL_HEIGHT,
          color,
          thickness: scaledThickness,
          stages: stagesArrays
        }, [offscreen])
        rendererRef.current = worker
      } catch {
        canvas.width = INTERNAL_WIDTH
        canvas.height = INTERNAL_HEIGHT
        rendererRef.current = new CanvasRenderer(canvas, {
          width: INTERNAL_WIDTH,
          height: INTERNAL_HEIGHT,
          color,
          thickness: scaledThickness,
          stages: stagesArrays
        })
      }
    } else {
      canvas.width = INTERNAL_WIDTH
      canvas.height = INTERNAL_HEIGHT
      rendererRef.current = new CanvasRenderer(canvas, {
        width: INTERNAL_WIDTH,
        height: INTERNAL_HEIGHT,
        color,
        thickness: scaledThickness,
        stages: stagesArrays
      })
    }

    return () => {
      if (rendererRef.current && rendererRef.current.terminate) {
        rendererRef.current.terminate()
      }
      rendererRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (rendererRef.current) {
      const scaledThickness = thickness * (INTERNAL_HEIGHT / window.innerHeight)
      rendererRef.current.postMessage({ type: 'updateStyle', color, thickness: scaledThickness })
    }
  }, [color, thickness])

  const morph = useCallback((stageIndex, { duration, ease }) => {
    if (rendererRef.current) {
      rendererRef.current.postMessage({
        type: 'morph',
        stage: stageIndex,
        duration,
        ease
      })
    }
  }, [])

  const snap = useCallback((stageIndex) => {
    if (rendererRef.current) {
      rendererRef.current.postMessage({ type: 'snap', stage: stageIndex })
    }
  }, [])

  return { morph, snap }
}
