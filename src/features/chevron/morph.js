// Point-array morphing for the worker and the main-thread fallback alike. A new target retargets from wherever the shape is
// now: one animation loop at a time, never two fighting over the same points.

import { spring } from './searchMotion'

export const easings = {
  spring,
  linear: t => t,
  // The cubic form of --ease-move (Stage.module.css), so a morph stays in step with the CSS travel beside it.
  easeInOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
}

// A `shape` is one morph's moving state: the current points, where they come from and go to, and the queued steps.
function aim(shape, { stage, duration, ease }) {
  shape.from = Float32Array.from(shape.current)
  shape.target = shape.stages[stage]
  shape.start = shape.now()
  shape.duration = Math.max(0, duration)
  shape.ease = easings[ease] ?? easings.easeInOut
}

// Draws one frame, and keeps the single loop going while a step is unfinished or queued.
function step(shape) {
  const { current, from, target, start, duration } = shape
  const progress = duration > 0 ? Math.min((shape.now() - start) / duration, 1) : 1
  const t = shape.ease(progress)
  for (let i = 0; i < current.length; i++) current[i] = from[i] + (target[i] - from[i]) * t
  shape.draw(current)
  const next = progress < 1 ? null : shape.queue.shift()
  if (next) aim(shape, next)
  shape.running = progress < 1 || Boolean(next)
  if (shape.running) shape.raf(() => step(shape))
}

/** @param {{ stages: ArrayLike<number>[], draw: (points: Float32Array) => void, raf: (cb: () => void) => unknown, now: () => number }} deps */
export function createMorph({ stages, draw, raf, now }) {
  const current = Float32Array.from(stages[0])
  const shape = {
    stages, draw, raf, now, current,
    from: Float32Array.from(current), target: stages[0], start: 0, duration: 0, ease: easings.linear, running: false, queue: []
  }

  return {
    // `then` lists further steps ({ stage, duration, ease }) to run after this one; any new call drops them.
    morph(stage, durationMs, easeName, then = []) {
      if (!shape.stages[stage]) return
      shape.queue = then.filter(next => shape.stages[next.stage])
      aim(shape, { stage, duration: durationMs, ease: easeName })
      if (!shape.running) step(shape)
    },
    snap(stage) {
      if (!shape.stages[stage]) return
      shape.queue = []
      shape.target = shape.stages[stage]
      shape.duration = 0
      if (!shape.running) step(shape)
    },
    setStages(next) {
      shape.stages = next
      shape.target = next[0]
    },
    redraw: () => draw(current)
  }
}
