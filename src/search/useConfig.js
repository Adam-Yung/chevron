import { useMemo, useSyncExternalStore } from 'react'
import { CONFIG_EVENT } from '../storage/macrosConfig'

const EMPTY = Object.freeze({ macros: [], commands: [], engines: {} })

function subscribe(onChange) {
  window.addEventListener(CONFIG_EVENT, onChange)
  return () => window.removeEventListener(CONFIG_EVENT, onChange)
}

const read = () => window.CONFIG ?? EMPTY

/** window.CONFIG ({ macros, commands, engines }), re-read whenever the macros editor saves or resets it. */
export default function useConfig() {
  return useSyncExternalStore(subscribe, read, read)
}

/** Macros marked `pinned`, in config order: the sites menu and the dock. */
export function usePinnedMacros() {
  const config = useConfig()
  return useMemo(() => (config.macros ?? []).filter(m => m.pinned), [config])
}
