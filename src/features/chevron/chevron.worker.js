// Draws the chevron off the main thread, so its morph keeps its frame rate while React renders suggestions.
import { createChevronPainter } from './chevronPainter'

let painter = null

self.onmessage = ({ data }) => {
  if (data.type === 'init') {
    const clock = { raf: cb => self.requestAnimationFrame(cb), now: () => performance.now() }
    painter = createChevronPainter(data.canvas, clock, () => self.postMessage({ type: 'painted' }))
  }
  painter?.postMessage(data)
}
