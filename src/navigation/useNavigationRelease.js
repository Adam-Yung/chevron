import { useEffect } from 'react'
import { useUiStore } from '../state/UiStore'
import { ui } from '../state/ui'

// A same-tab navigation that has not unloaded the page by then never will (external protocol handler, download, blocked URL), or
// the server is slow; either way the start page must not stay frozen in its leaving pose.
export const LEAVING_TIMEOUT_MS = 4000

/** Releases a pending navigation on every way back to this page: bfcache restore, tab shown again, or timeout. */
export default function useNavigationRelease() {
  const store = useUiStore()

  useEffect(() => {
    let timer = null
    const release = () => {
      clearTimeout(timer)
      if (store.getState().leaving) store.dispatch(ui.reset())
    }
    const onPageShow = e => { if (e.persisted) release() }
    const onVisible = () => { if (document.visibilityState === 'visible') release() }
    let wasLeaving = store.getState().leaving
    const unsubscribe = store.subscribe(() => {
      const leaving = store.getState().leaving
      if (leaving === wasLeaving) return
      wasLeaving = leaving
      clearTimeout(timer)
      if (leaving) timer = setTimeout(release, LEAVING_TIMEOUT_MS)
    })

    window.addEventListener('pageshow', onPageShow)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      unsubscribe()
      clearTimeout(timer)
      window.removeEventListener('pageshow', onPageShow)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [store])
}
