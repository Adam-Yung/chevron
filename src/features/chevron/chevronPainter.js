// One message protocol for both renderers: the worker (OffscreenCanvas) and the main-thread fallback (file://, old browsers).
import { createMorph } from './morph'
import { drawChevron } from './drawChevron'

/**
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas
 * @param {{ raf: (cb: () => void) => unknown, now: () => number }} clock
 * @param {() => void} [onFirstFrame]  called one frame after the first drawing, when it is on screen
 */
export function createChevronPainter(canvas, clock, onFirstFrame) {
  const ctx = canvas.getContext('2d')
  const style = { width: canvas.width, height: canvas.height, color: '#000', thread: '#fff', thickness: 10 }
  let morph = null

  const draw = points => drawChevron(ctx, points, style)

  const handlers = {
    init(m) {
      canvas.width = style.width = m.width
      canvas.height = style.height = m.height
      Object.assign(style, { color: m.color, thread: m.thread, thickness: m.thickness, scale: m.scale })
      morph = createMorph({ stages: m.stages, draw, ...clock })
      morph.snap(m.stage ?? 0)
      if (onFirstFrame) clock.raf(onFirstFrame)
    },
    resize(m) {
      canvas.width = style.width = m.width
      canvas.height = style.height = m.height
      Object.assign(style, { thickness: m.thickness ?? style.thickness, scale: m.scale ?? style.scale })
      morph?.redraw()
    },
    style(m) {
      Object.assign(style, { color: m.color ?? style.color, thread: m.thread ?? style.thread, thickness: m.thickness ?? style.thickness, scale: m.scale ?? style.scale })
      morph?.redraw()
    },
    stages(m) {
      morph?.setStages(m.stages)
      morph?.snap(m.stage ?? 0)
    },
    morph: m => morph?.morph(m.stage, m.duration, m.ease, m.then),
    snap: m => morph?.snap(m.stage)
  }

  return { postMessage: message => handlers[message.type]?.(message), terminate() {} }
}
