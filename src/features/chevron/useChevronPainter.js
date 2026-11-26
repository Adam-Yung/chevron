import { useCallback, useEffect, useRef } from 'react'
import ChevronWorker from './chevron.worker.js?worker'
import { createChevronPainter } from './chevronPainter'

const MAX_PIXELS = 2048

function measure(host, thickness) {
  const rect = host.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const side = Math.max(1, Math.min(MAX_PIXELS, Math.round(Math.max(rect.width, rect.height) * dpr)))
  return { width: side, height: side, thickness: thickness * (side / Math.max(rect.height, 1)) }
}

// The worker is created before the canvas is transferred: on file:// creating it throws, and a transferred canvas can no longer
// be drawn on from the main thread.
function startPainter(canvas, init) {
  if (typeof OffscreenCanvas !== 'undefined' && canvas.transferControlToOffscreen) {
    try {
      const worker = new ChevronWorker()
      const offscreen = canvas.transferControlToOffscreen()
      worker.postMessage({ ...init, type: 'init', canvas: offscreen }, [offscreen])
      return worker
    } catch {
      // fall through to the main-thread painter
    }
  }
  const painter = createChevronPainter(canvas, { raf: cb => requestAnimationFrame(cb), now: () => performance.now() })
  painter.postMessage({ ...init, type: 'init' })
  return painter
}

/**
 * Mounts a canvas into `hostRef` and returns `post(message)` for morph/snap/style messages (see chevronPainter.js).
 * The canvas is created here, not rendered by React: a transferred canvas cannot be transferred again, and React's StrictMode
 * mounts effects twice on the same element.
 */
export default function useChevronPainter(hostRef, { stages, stage, color, thickness }) {
  const painterRef = useRef(null)
  const latest = useRef({ stages, stage, color, thickness })
  latest.current = { stages, stage, color, thickness }

  useEffect(() => {
    const host = hostRef.current
    const canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    host.appendChild(canvas)
    const { stages: s, stage: initialStage, color: c, thickness: t } = latest.current
    const painter = startPainter(canvas, { ...measure(host, t), stages: s.map(a => Array.from(a)), stage: initialStage, color: c })
    painterRef.current = painter

    let frame = 0
    const onResize = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => painter.postMessage({ type: 'resize', ...measure(host, latest.current.thickness) }))
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(frame)
      painter.terminate()
      painterRef.current = null
      canvas.remove()
    }
  }, [hostRef])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    painterRef.current?.postMessage({ type: 'style', color, thickness: measure(host, thickness).thickness })
  }, [hostRef, color, thickness])

  useEffect(() => {
    painterRef.current?.postMessage({ type: 'stages', stages: stages.map(a => Array.from(a)), stage: latest.current.stage })
  }, [stages])

  return useCallback(message => painterRef.current?.postMessage(message), [])
}
