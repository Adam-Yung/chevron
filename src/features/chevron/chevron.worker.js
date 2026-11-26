// Draws the chevron off the main thread, so its morph keeps its frame rate while React renders suggestions.
import { createChevronPainter } from './chevronPainter'

let painter = null

self.onmessage = ({ data }) => {
  if (data.type === 'init') painter = createChevronPainter(data.canvas, { raf: cb => self.requestAnimationFrame(cb), now: () => performance.now() })
  painter?.postMessage(data)
}
