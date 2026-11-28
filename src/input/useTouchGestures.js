import { useEffect, useRef } from 'react'
import { useUiStore } from '../state/UiStore'
import { ui } from '../state/ui'
import { classifySwipe } from './swipe'
import { emitMacroPage } from './gestureEvents'
import { getQueryField } from '../features/search/queryFieldId'

const OWN_SCROLL = '[data-keep-focus], [data-scrollable]'

// What a swipe direction means in each view.
const SWIPE_ACTS = {
  idle: { up: 'toggle', left: 'focus' },
  macros: { down: 'close', left: 'next', right: 'previous' },
  search: { right: 'clear' }
}

const RUN = {
  toggle: store => store.dispatch(ui.macrosToggled(false)),
  close: store => store.dispatch(ui.macrosClosed()),
  next: () => emitMacroPage('+'),
  previous: () => emitMacroPage('-'),
  focus: () => getQueryField()?.focus(),
  clear: store => { store.dispatch(ui.typed('')); getQueryField()?.blur() }
}

// `touch.start` is where and when the finger went down, or null while there is no swipe to judge.
const touchStartHandler = (touch, enabledRef) => e => {
  const inOwnScroller = e.target?.closest?.(OWN_SCROLL)
  touch.start = enabledRef.current && e.touches.length === 1 && !inOwnScroller
    ? { x: e.touches[0].clientX, y: e.touches[0].clientY, t: performance.now() } : null
}

const touchEndHandler = (touch, store) => e => {
  const { start } = touch
  if (!start) return
  const t = e.changedTouches[0]
  const direction = classifySwipe({ dx: t.clientX - start.x, dy: t.clientY - start.y, dt: performance.now() - start.t })
  touch.start = null
  const act = direction && SWIPE_ACTS[store.getState().view]?.[direction]
  if (act && !store.getState().overlay) RUN[act](store)
}

const touchCancelHandler = touch => () => { touch.start = null }

/** Single-finger swipes. Focusing the field happens inside the touch handler so the browser lets the keyboard open. */
export default function useTouchGestures(enabled) {
  const store = useUiStore()
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  useEffect(() => {
    const touch = { start: null }
    const onStart = touchStartHandler(touch, enabledRef)
    const onEnd = touchEndHandler(touch, store)
    const onCancel = touchCancelHandler(touch)

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    window.addEventListener('touchcancel', onCancel, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onCancel)
    }
  }, [store])
}
