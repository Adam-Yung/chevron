import { lazy, Suspense, useEffect, useState } from 'react'
import { useUi } from '../../state/UiStore'
import ChevronTop from './ChevronTop'
import classes from './MacrosLayer.module.css'

const loadMenu = () => import('./MacrosMenu')
const MacrosMenu = lazy(loadMenu)

// Fetch the menu chunk while the browser is idle, so the first open is not waiting on it.
if (typeof requestIdleCallback === 'function') requestIdleCallback(() => loadMenu())
else setTimeout(loadMenu, 300)

// Clock above the bar, sites below it. Mounted from the first open on and kept, so reopening is instant; `inert` while closed so
// hidden cards can never take focus or clicks.
export default function MacrosLayer({ view, onOpenMacro }) {
  const open = view === 'macros'
  const epoch = useUi(s => s.epoch)
  const [mounted, setMounted] = useState(open)
  useEffect(() => { if (open) setMounted(true) }, [open])

  return (
    <div className={classes.layer} data-open={open || undefined} inert={open ? undefined : ''}>
      <div className={classes.top} data-macros-top><ChevronTop /></div>
      <div className={classes.bottom}>
        <div className={classes.slide}>
          {mounted && (
            <Suspense fallback={null}>
              <MacrosMenu key={epoch} active={open} onOpen={onOpenMacro} />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  )
}
