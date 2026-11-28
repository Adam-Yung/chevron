import { useEffect } from 'react'
import { useUiStore } from '../state/UiStore'
import { ui } from '../state/ui'
import { whenTabVisible } from '../app/whenTabVisible'

// A same-tab navigation that has not unloaded the page by then never will (external protocol handler, download, blocked URL), or
// the server is slow; either way the start page must not stay frozen in its leaving pose.
export const LEAVING_TIMEOUT_MS = 4000

// `pending.timer` is the safety timeout of the navigation in flight.
const releaser = (store, pending) => () => {
  clearTimeout(pending.timer)
  if (store.getState().leaving) store.dispatch(ui.reset())
}

const onBfcacheRestore = release => e => { if (e.persisted) release() }

// Only a change of `leaving` touches the timer, so unrelated dispatches cannot postpone it.
function armOnLeaving(store, pending, release) {
  let wasLeaving = store.getState().leaving
  return store.subscribe(() => {
    const leaving = store.getState().leaving
    if (leaving === wasLeaving) return
    wasLeaving = leaving
    clearTimeout(pending.timer)
    if (leaving) pending.timer = setTimeout(release, LEAVING_TIMEOUT_MS)
  })
}

/** Releases a pending navigation on every way back to this page: bfcache restore, tab shown again, or timeout. */
export default function useNavigationRelease() {
  const store = useUiStore()

  useEffect(() => {
    const pending = { timer: null }
    const release = releaser(store, pending)
    const onPageShow = onBfcacheRestore(release)
    const onVisible = whenTabVisible(release)
    const unsubscribe = armOnLeaving(store, pending, release)

    window.addEventListener('pageshow', onPageShow)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      unsubscribe()
      clearTimeout(pending.timer)
      window.removeEventListener('pageshow', onPageShow)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [store])
}
