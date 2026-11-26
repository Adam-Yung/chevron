import { describe, it, expect } from 'vitest'
import { classifySwipe } from './swipe'

describe('classifySwipe', () => {
  it.each([
    [{ dx: 0, dy: -60, dt: 200 }, 'up'],
    [{ dx: 0, dy: 60, dt: 200 }, 'down'],
    [{ dx: -60, dy: 10, dt: 200 }, 'left'],
    [{ dx: 60, dy: -10, dt: 200 }, 'right'],
    [{ dx: 25, dy: 0, dt: 50 }, 'right'],
    [{ dx: 25, dy: 0, dt: 300 }, null],
    [{ dx: 5, dy: 3, dt: 10 }, null],
    [{ dx: 0, dy: -200, dt: 900 }, null]
  ])('%o -> %s', (move, expected) => {
    expect(classifySwipe(move)).toBe(expected)
  })
})
