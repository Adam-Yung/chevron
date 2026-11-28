// Adds up wheel deltas so only a deliberate scroll counts; a pause of `decayMs` starts the total again.
export function createWheelAccumulator(decayMs) {
  let total = 0
  let decay = 0
  return {
    add(delta) {
      clearTimeout(decay)
      decay = setTimeout(() => { total = 0 }, decayMs)
      total += delta
      return total
    },
    reset() { total = 0 },
    stop() { clearTimeout(decay) }
  }
}
