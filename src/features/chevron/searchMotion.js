// The two beats of the move into search, shared by the canvas (the stripe) and the stylesheet (the fill) so they stay together:
// the chevron becomes a straight line on the screen edge, then the line springs out into the curve.

/** Lengths as multiples of the animation speed setting. */
export const LINE_BEAT = 0.8
export const BOUNCE_BEAT = 2.4

const DECAY = 5.5
const FREQUENCY = 11.9

/** A damped spring released from rest: 0 at 0, about 23% past 1 a quarter of the way in, exactly 1 at the end. */
export function spring(t) {
  if (t >= 1) return 1
  return 1 - Math.exp(-DECAY * t) * (Math.cos(FREQUENCY * t) + (DECAY / FREQUENCY) * Math.sin(FREQUENCY * t))
}

const STEPS = 60
export const SPRING_CSS = `linear(${Array.from({ length: STEPS + 1 }, (_, i) => +spring(i / STEPS).toFixed(4)).join(',')})`
