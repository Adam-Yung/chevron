import { useCallback, useContext } from 'react'
import { SettingsContext } from '../settings/SettingsProvider'
import { useDispatch } from '../state/UiStore'
import { ui } from '../state/ui'
import { openDestination } from '../navigation/navigate'

/**
 * Open a URL the way the user asked, and leave the start page in a state that cannot get stuck: a new tab resets it at once,
 * a same-tab navigation marks it leaving (released by useNavigationRelease if the page never unloads).
 * @returns {(url: string, options?: { newTab?: boolean, macro?: string }) => void}
 */
export default function useLaunch() {
  const settings = useContext(SettingsContext)
  const dispatch = useDispatch()
  const alwaysNewTab = settings.general.redirectTarget === '_blank'

  return useCallback((url, { newTab = false, macro } = {}) => {
    const result = openDestination(url, { newTab: newTab || alwaysNewTab })
    if (result === 'blocked') return dispatch(ui.noticed('That link is blocked'))
    if (result === 'new-tab') return dispatch(ui.reset())
    dispatch(ui.leaving(url, macro))
  }, [dispatch, alwaysNewTab])
}
