import { useEffect, useRef } from 'react'
import { useUiStore } from '../state/UiStore'
import { ui } from '../state/ui'
import { getQueryField, QUERY_FIELD_ID } from '../features/search/queryFieldId'
import { createWheelAccumulator } from './wheelAccumulator'

const INTERACTIVE = 'button, input, textarea, select, a[href], summary, [role="button"], [contenteditable="true"], [tabindex]:not([tabindex="-1"]), [data-keep-focus]'
const WHEEL = { threshold: 120, cooldownMs: 900, decayMs: 450 }

// A click on empty space puts the caret back in the field, so typing always works; clicks on controls keep their focus.
const mouseDownHandler = store => e => {
  const { view, overlay } = store.getState()
  if (overlay || e.target?.closest?.(INTERACTIVE)) return
  // A click on empty space around the open menu closes it, like clicking outside any popup.
  if (view === 'macros') {
    if (e.button === 0 && !e.target?.closest?.('.splide, [data-macros-top]')) store.dispatch(ui.macrosClosed())
    return
  }
  const field = getQueryField()
  if (field && document.activeElement !== field) {
    e.preventDefault()
    field.focus()
  }
}

const contextMenuHandler = store => e => {
  const { view, overlay } = store.getState()
  const inField = Boolean(e.target?.closest?.(`#${QUERY_FIELD_ID}`))
  // On a control, or on the field while it holds text, the browser's own menu (copy, paste) is what the user wants.
  if (overlay || (inField && view === 'search') || (!inField && e.target?.closest?.(INTERACTIVE))) return
  e.preventDefault()
  store.dispatch(ui.macrosToggled(false))
}

function useFocusKeeper(store) {
  useEffect(() => {
    const onMouseDown = mouseDownHandler(store)
    const onContextMenu = contextMenuHandler(store)
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('contextmenu', onContextMenu)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('contextmenu', onContextMenu)
    }
  }, [store])
}

// A vertical scroll that neither a panel nor a scrollable list has a use for.
function isMenuScroll(e) {
  if (e.target?.closest?.('[data-keep-focus], [data-scrollable]')) return false
  return Math.abs(e.deltaX) <= Math.abs(e.deltaY)
}

function wheelAction(total, view) {
  if (total < -WHEEL.threshold && view === 'idle') return ui.macrosToggled(false)
  if (total > WHEEL.threshold && view === 'macros') return ui.macrosClosed()
  return null
}

function wheelHandler(store, enabledRef, scroll) {
  let lastAction = 0
  return e => {
    const { view, overlay } = store.getState()
    if (!enabledRef.current || overlay || !isMenuScroll(e)) return
    const total = scroll.add(e.deltaY)
    if (Date.now() - lastAction < WHEEL.cooldownMs) return
    const action = wheelAction(total, view)
    if (!action) return
    store.dispatch(action)
    scroll.reset()
    lastAction = Date.now()
  }
}

// Scroll up opens the sites menu, scroll down closes it. Deltas accumulate so a resting finger on a trackpad does nothing, and a
// cooldown stops one long fling from toggling twice.
function useWheelToggle(store, enabledRef) {
  useEffect(() => {
    const scroll = createWheelAccumulator(WHEEL.decayMs)
    const onWheel = wheelHandler(store, enabledRef, scroll)
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      scroll.stop()
    }
  }, [store, enabledRef])
}

/** Mouse and trackpad: focus keeping, right-click toggle, scroll toggle. */
export default function usePointerInput({ wheelEnabled }) {
  const store = useUiStore()
  const wheelRef = useRef(wheelEnabled)
  wheelRef.current = wheelEnabled
  useFocusKeeper(store)
  useWheelToggle(store, wheelRef)
}
