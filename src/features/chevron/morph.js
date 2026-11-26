// Point-array morphing shared by the worker and the main-thread fallback, so both behave identically. A new target retargets
// from wherever the shape is now: one animation loop at a time, never two fighting over the same points.

export const easings = {
  linear: t => t,
  easeIn: t => t * t,
  easeOut: t => 1 - (1 - t) * (1 - t),
  easeInOut: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
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

  function step() {
    const progress = duration > 0 ? Math.min((now() - start) / duration, 1) : 1
    const t = ease(progress)
    for (let i = 0; i < current.length; i++) current[i] = from[i] + (target[i] - from[i]) * t
    draw(current)
    running = progress < 1
    if (running) raf(step)
  }

  return {
    morph(stage, durationMs, easeName) {
      if (!stages[stage]) return
      from = Float32Array.from(current)
      target = stages[stage]
      start = now()
      duration = Math.max(0, durationMs)
      ease = easings[easeName] ?? easings.easeInOut
      if (!running) step()
    },
    snap(stage) {
      if (!stages[stage]) return
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
