// Swipe recognition, kept pure so the thresholds are unit-tested without touch events.

export const SWIPE = { threshold: 40, velocity: 0.3, timeLimit: 600, deadZone: 8 }

// `move` is the finger's travel in px and its duration in ms.
/** @returns {'up' | 'down' | 'left' | 'right' | null} */
export function classifySwipe({ dx, dy, dt }, cfg = SWIPE) {
  const vertical = Math.abs(dy) > Math.abs(dx)
  const dist = vertical ? Math.abs(dy) : Math.abs(dx)
  if (dt > cfg.timeLimit || dist <= cfg.deadZone) return null
  // A quick flick commits at half the distance: short gestures on big tablets should still count.
  const flick = dist / Math.max(1, dt) >= cfg.velocity && dist >= cfg.threshold / 2
  if (dist < cfg.threshold && !flick) return null
  if (vertical) return dy < 0 ? 'up' : 'down'
  return dx < 0 ? 'left' : 'right'
}
