import { useCallback, useEffect, useRef } from 'react'
import ChevronWorker from './chevron.worker.js?worker'
import { createChevronPainter } from './chevronPainter'

const MAX_PIXELS = 2048

function measure(host, thickness) {
  const rect = host.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const side = Math.max(1, Math.min(MAX_PIXELS, Math.round(Math.max(rect.width, rect.height) * dpr)))
  const scale = side / Math.max(rect.height, 1)
  return { width: side, height: side, scale, thickness: thickness * scale }
}

const pick = ({ thickness, scale }) => ({ thickness, scale })

// Never from a local file: Chromium throws there, but Safari and Firefox construct a worker that never draws.
export function canUseWorker(canvas, protocol) {
  return protocol !== 'file:' && typeof OffscreenCanvas !== 'undefined' && Boolean(canvas.transferControlToOffscreen)
}

// The worker is created before the canvas is transferred: if creating it throws, a transferred canvas could no longer be drawn on
// from the main thread.
function startPainter(canvas, init, onFirstFrame) {
  if (canUseWorker(canvas, window.location.protocol)) {
    try {
      const worker = new ChevronWorker()
      // The worker's frame is not the page's: wait one page frame too, so the canvas has reached the screen.
      worker.onmessage = ({ data }) => { if (data?.type === 'painted') requestAnimationFrame(onFirstFrame) }
      // A worker chunk that fails to load never reports; drop the shell rather than leave a stale chevron for the session.
      worker.onerror = () => onFirstFrame()
      const offscreen = canvas.transferControlToOffscreen()
      worker.postMessage({ ...init, type: 'init', canvas: offscreen }, [offscreen])
      return worker
    } catch {
      // fall through to the main-thread painter
    }
  }
  const painter = createChevronPainter(canvas, { raf: cb => requestAnimationFrame(cb), now: () => performance.now() }, onFirstFrame)
  painter.postMessage({ ...init, type: 'init' })
  return painter
}

// Mounts a canvas into `hostRef` and returns `post(message)` for morph, snap and style messages (see chevronPainter.js). The
// canvas is created here, not rendered by React: a transferred one cannot be transferred again by StrictMode's second effect.
export default function useChevronPainter(hostRef, { stages, stage, color, thread, thickness, viewport, onFirstFrame }) {
  const painterRef = useRef(null)
  const latest = useRef({ stages, stage, color, thread, thickness })
  latest.current = { stages, stage, color, thread, thickness, onFirstFrame }

  useEffect(() => {
    const host = hostRef.current
    const canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    host.appendChild(canvas)
    const { stages: s, stage: initialStage, color: c, thread: th, thickness: t } = latest.current
    const init = { ...measure(host, t), stages: s.map(a => Array.from(a)), stage: initialStage, color: c, thread: th }
    const painter = startPainter(canvas, init, () => latest.current.onFirstFrame?.())
    painterRef.current = painter

    return () => {
      painter.terminate()
      painterRef.current = null
      canvas.remove()
    }
  }, [hostRef])

  // The same viewport the stages are built from, which also notices a size gained without a resize event.
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    painterRef.current?.postMessage({ type: 'resize', ...measure(host, latest.current.thickness) })
  }, [hostRef, viewport])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    painterRef.current?.postMessage({ type: 'style', color, thread, ...pick(measure(host, thickness)) })
  }, [hostRef, color, thread, thickness])

  useEffect(() => {
    painterRef.current?.postMessage({ type: 'stages', stages: stages.map(a => Array.from(a)), stage: latest.current.stage })
  }, [stages])

  return useCallback(message => painterRef.current?.postMessage(message), [])
}
