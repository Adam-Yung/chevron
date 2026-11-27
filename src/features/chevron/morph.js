// Point-array morphing shared by the worker and the main-thread fallback, so both behave identically. A new target retargets
// from wherever the shape is now: one animation loop at a time, never two fighting over the same points.

import { spring } from './searchMotion'

export const easings = {
  spring,
  linear: t => t,
  easeIn: t => t * t,
  easeOut: t => 1 - (1 - t) * (1 - t),
  // The cubic form of --ease-move (Stage.module.css), so a morph stays in step with the CSS travel beside it.
  easeInOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  easeOutCubic: t => 1 - Math.pow(1 - t, 3)
}

/**
 * @param {{ stages: ArrayLike<number>[], draw: (points: Float32Array) => void, raf: (cb: () => void) => unknown, now: () => number }} deps
 */
export function createMorph({ stages, draw, raf, now }) {
  const current = Float32Array.from(stages[0])
  let from = Float32Array.from(current)
  let target = stages[0]
  let start = 0
  let duration = 0
  let ease = easings.linear
  let running = false
  let queue = []

  function aim({ stage, duration: ms, ease: easeName }) {
    from = Float32Array.from(current)
    target = stages[stage]
    start = now()
    duration = Math.max(0, ms)
    ease = easings[easeName] ?? easings.easeInOut
  }

  function step() {
    const progress = duration > 0 ? Math.min((now() - start) / duration, 1) : 1
    const t = ease(progress)
    for (let i = 0; i < current.length; i++) current[i] = from[i] + (target[i] - from[i]) * t
    draw(current)
    const next = progress < 1 ? null : queue.shift()
    if (next) aim(next)
    running = progress < 1 || Boolean(next)
    if (running) raf(step)
  }

  return {
    // `then` lists further steps ({ stage, duration, ease }) to run after this one; any new call drops them.
    morph(stage, durationMs, easeName, then = []) {
      if (!stages[stage]) return
      queue = then.filter(next => stages[next.stage])
      aim({ stage, duration: durationMs, ease: easeName })
      if (!running) step()
    },
    snap(stage) {
      if (!stages[stage]) return
      queue = []
      target = stages[stage]
      duration = 0
      if (!running) step()
    },
    setStages(next) {
      stages = next
      target = stages[0]
    },
    redraw: () => draw(current),
    points: () => current
  }
}
